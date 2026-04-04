"use client";

import { useEffect, useState } from "react";

type ServiceOption = {
  id: string;
  name: string;
  shortDescription: string | null;
};

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
};

function getMinDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function isSundayDate(dateISO: string) {
  const [year, month, day] = dateISO.split("-").map(Number);
  return new Date(year, month - 1, day).getDay() === 0;
}

function isValidFullName(value: string) {
  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(value.trim()) && value.trim().length >= 3;
}

function isValidPhone(value: string) {
  return /^\d{10}$/.test(value);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function AppointmentForm({ services }: { services: ServiceOption[] }) {
  const [form, setForm] = useState<FormState>({
    fullName: "",
    phone: "",
    email: "",
    serviceId: services[0]?.id || "",
    appointmentDate: "",
    appointmentTime: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availabilityMessage, setAvailabilityMessage] = useState("Selecciona una fecha para ver los horarios disponibles.");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const minDate = getMinDate();
  const isFormValid =
    isValidFullName(form.fullName) &&
    isValidPhone(form.phone) &&
    isValidEmail(form.email) &&
    form.serviceId.trim().length > 0 &&
    form.appointmentDate.trim().length > 0 &&
    form.appointmentTime.trim().length > 0;

  useEffect(() => {
    let isMounted = true;

    async function loadAvailability() {
      if (!form.appointmentDate) {
        setAvailableTimes([]);
        setAvailabilityMessage("Selecciona una fecha para ver los horarios disponibles.");
        setForm((current) => ({ ...current, appointmentTime: "" }));
        return;
      }

      setAvailabilityLoading(true);

      try {
        const response = await fetch(`/api/availability?date=${form.appointmentDate}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "No se pudo consultar la disponibilidad.");
        }

        if (!isMounted) {
          return;
        }

        setAvailableTimes(data.availableTimes || []);
        setAvailabilityMessage(data.message || "Selecciona una de las horas disponibles.");
        setForm((current) => ({
          ...current,
          appointmentTime: (data.availableTimes || []).includes(current.appointmentTime) ? current.appointmentTime : ""
        }));
      } catch (availabilityError) {
        if (!isMounted) {
          return;
        }

        setAvailableTimes([]);
        setAvailabilityMessage(
          availabilityError instanceof Error
            ? availabilityError.message
            : "No se pudo consultar la disponibilidad."
        );
        setForm((current) => ({ ...current, appointmentTime: "" }));
      } finally {
        if (isMounted) {
          setAvailabilityLoading(false);
        }
      }
    }

    loadAvailability();

    return () => {
      isMounted = false;
    };
  }, [form.appointmentDate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isFormValid) {
      setError("Completa correctamente todos los campos obligatorios.");
      setMessage(null);
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          serviceId: form.serviceId,
          date: `${form.appointmentDate}T${form.appointmentTime}`,
          notes: form.notes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo registrar la cita.");
      }

      setMessage("Tu solicitud fue registrada. Revisaremos la disponibilidad y te confirmaremos por WhatsApp o correo.");
      setForm({
        fullName: "",
        phone: "",
        email: "",
        serviceId: services[0]?.id || "",
        appointmentDate: "",
        appointmentTime: "",
        notes: ""
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-slate-950">Agenda una cita</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Completa el formulario para solicitar una reunión. Esta base ya queda lista para confirmaciones por
          WhatsApp, correo y seguimiento interno desde un panel administrativo.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-800">Nombre completo</span>
          <input
            required
            value={form.fullName}
            onChange={(event) => {
              const nextValue = event.target.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, "");
              setForm({ ...form, fullName: nextValue });
            }}
            className="form-input"
            placeholder="Juan Pérez"
            inputMode="text"
            pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+"
            title="Ingresa solo letras."
          />
          {form.fullName.length > 0 && !isValidFullName(form.fullName) ? (
            <span className="text-xs text-rose-600">Ingresa solo letras y al menos un nombre válido.</span>
          ) : null}
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-800">Teléfono / WhatsApp</span>
          <input
            required
            value={form.phone}
            onChange={(event) => {
              const nextValue = event.target.value.replace(/\D/g, "").slice(0, 10);
              setForm({ ...form, phone: nextValue });
            }}
            className="form-input"
            placeholder="0998622737"
            inputMode="numeric"
            maxLength={10}
            pattern="\d{10}"
            title="Ingresa solo 10 dígitos."
          />
          {form.phone.length > 0 && !isValidPhone(form.phone) ? (
            <span className="text-xs text-rose-600">Ingresa solo números y exactamente 10 dígitos.</span>
          ) : null}
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-800">Correo electrónico</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className="form-input"
            placeholder="cliente@empresa.com"
            inputMode="email"
          />
          {form.email.length > 0 && !isValidEmail(form.email) ? (
            <span className="text-xs text-rose-600">Ingresa un correo válido con arroba.</span>
          ) : null}
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-800">Servicio</span>
          <select
            value={form.serviceId}
            onChange={(event) => setForm({ ...form, serviceId: event.target.value })}
            className="form-input"
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-3xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
        {services.find((service) => service.id === form.serviceId)?.shortDescription ||
          "Selecciona el servicio que mejor se ajuste a tu necesidad."}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-800">Fecha</span>
          <input
            required
            type="date"
            min={minDate}
            value={form.appointmentDate}
            onChange={(event) => {
              const nextDate = event.target.value;

              if (nextDate && isSundayDate(nextDate)) {
                setForm({ ...form, appointmentDate: "", appointmentTime: "" });
                setError("Los domingos no están disponibles. Selecciona otro día.");
                setMessage(null);
                return;
              }

              setError(null);
              setForm({ ...form, appointmentDate: nextDate, appointmentTime: "" });
            }}
            className="form-input"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-800">Hora</span>
          <select
            required
            value={form.appointmentTime}
            onChange={(event) => setForm({ ...form, appointmentTime: event.target.value })}
            className="form-input"
            disabled={!form.appointmentDate || availabilityLoading || availableTimes.length === 0}
          >
            <option value="">
              {!form.appointmentDate
                ? "Primero elige una fecha"
                : availabilityLoading
                  ? "Consultando horarios disponibles..."
                  : availableTimes.length === 0
                    ? "No hay horas disponibles"
                    : "Selecciona una hora disponible"}
            </option>
            {availableTimes.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-3xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
        <p className="font-medium text-slate-800">Horario de atención</p>
        <p className="mt-2">
          Lunes a viernes: 08:00 a 13:00 y 14:00 a 18:00. Sábados: 09:00 a 13:00. Atención cada hora.
        </p>
        <p className="mt-2 text-brand-700">
          {availabilityLoading ? "Estamos revisando los horarios disponibles..." : availabilityMessage}
        </p>
      </div>

      <label className="space-y-2 text-sm">
        <span className="font-medium text-slate-800">Detalle de la necesidad</span>
        <textarea
          rows={5}
          value={form.notes}
          onChange={(event) => setForm({ ...form, notes: event.target.value })}
          className="form-input min-h-[140px] resize-y"
          placeholder="Cuéntame brevemente en qué necesitas ayuda, el tipo de negocio o el problema que quieres resolver."
        />
      </label>

      {message ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {loading ? (
        <p className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
          Estamos registrando tu cita y preparando la confirmación.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || services.length === 0 || !isFormValid}
        className="btn-primary w-full justify-center disabled:opacity-70"
      >
        {loading ? "Registrando cita..." : "Solicitar cita"}
      </button>
    </form>
  );
}
