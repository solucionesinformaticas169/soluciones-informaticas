"use client";

import { useEffect, useRef, useState } from "react";

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
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [form, setForm] = useState<FormState>({
    fullName: "",
    phone: "",
    email: "",
    serviceId: "",
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
  const missingFields = {
    fullName: form.fullName.trim().length === 0,
    phone: form.phone.trim().length === 0,
    email: form.email.trim().length === 0,
    serviceId: form.serviceId.trim().length === 0,
    appointmentDate: form.appointmentDate.trim().length === 0,
    appointmentTime: form.appointmentTime.trim().length === 0,
    notes: form.notes.trim().length === 0
  };
  const invalidFields = {
    fullName: form.fullName.trim().length > 0 && !isValidFullName(form.fullName),
    phone: form.phone.trim().length > 0 && !isValidPhone(form.phone),
    email: form.email.trim().length > 0 && !isValidEmail(form.email)
  };
  const missingCount = Object.values(missingFields).filter(Boolean).length;
  const invalidCount = Object.values(invalidFields).filter(Boolean).length;
  const isFormValid =
    isValidFullName(form.fullName) &&
    isValidPhone(form.phone) &&
    isValidEmail(form.email) &&
    form.serviceId.trim().length > 0 &&
    form.appointmentDate.trim().length > 0 &&
    form.appointmentTime.trim().length > 0 &&
    form.notes.trim().length > 0;

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

  function openDatePicker() {
    const input = dateInputRef.current;
    if (!input) {
      return;
    }

    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };

    if (typeof pickerInput.showPicker === "function") {
      pickerInput.showPicker();
      return;
    }

    input.focus();
    input.click();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);

    if (missingCount > 0) {
      setError(missingCount === 1 ? "Ingrese el campo que falta." : "Ingrese los campos que faltan.");
      setMessage(null);
      return;
    }

    if (invalidCount > 0 || !isFormValid) {
      setError(invalidCount === 1 ? "Revisa el campo marcado en rojo." : "Revisa los campos marcados en rojo.");
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
      setSubmitAttempted(false);
      setForm({
        fullName: "",
        phone: "",
        email: "",
        serviceId: "",
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-800">
            Nombre completo
            {submitAttempted && missingFields.fullName ? <span className="ml-1 text-rose-600">*</span> : null}
          </span>
          <input
            required
            value={form.fullName}
            onChange={(event) => {
              const nextValue = event.target.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, "");
              setError(null);
              setForm({ ...form, fullName: nextValue });
            }}
            className={`form-input ${
              submitAttempted && (missingFields.fullName || invalidFields.fullName)
                ? "border-rose-300 ring-2 ring-rose-100"
                : ""
            }`}
            inputMode="text"
            pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+"
            title="Ingresa solo letras."
          />
          {form.fullName.length > 0 && !isValidFullName(form.fullName) ? (
            <span className="text-xs text-rose-600">Ingresa solo letras y al menos un nombre válido.</span>
          ) : null}
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-800">
            Teléfono / WhatsApp
            {submitAttempted && missingFields.phone ? <span className="ml-1 text-rose-600">*</span> : null}
          </span>
          <input
            required
            value={form.phone}
            onChange={(event) => {
              const nextValue = event.target.value.replace(/\D/g, "").slice(0, 10);
              setError(null);
              setForm({ ...form, phone: nextValue });
            }}
            className={`form-input ${
              submitAttempted && (missingFields.phone || invalidFields.phone)
                ? "border-rose-300 ring-2 ring-rose-100"
                : ""
            }`}
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
          <span className="font-medium text-slate-800">
            Correo electrónico
            {submitAttempted && missingFields.email ? <span className="ml-1 text-rose-600">*</span> : null}
          </span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => {
              setError(null);
              setForm({ ...form, email: event.target.value });
            }}
            className={`form-input ${
              submitAttempted && (missingFields.email || invalidFields.email)
                ? "border-rose-300 ring-2 ring-rose-100"
                : ""
            }`}
            inputMode="email"
          />
          {form.email.length > 0 && !isValidEmail(form.email) ? (
            <span className="text-xs text-rose-600">Ingresa un correo válido con arroba.</span>
          ) : null}
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-800">
            Elija un servicio
            {submitAttempted && missingFields.serviceId ? <span className="ml-1 text-rose-600">*</span> : null}
          </span>
          <select
            required
            value={form.serviceId}
            onChange={(event) => {
              setError(null);
              setForm({ ...form, serviceId: event.target.value });
            }}
            className={`form-input ${submitAttempted && missingFields.serviceId ? "border-rose-300 ring-2 ring-rose-100" : ""}`}
          >
            <option value="">Seleccione</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {form.serviceId ? (
        <div className="rounded-3xl border border-brand-200 bg-[linear-gradient(135deg,rgba(49,141,255,0.12),rgba(49,141,255,0.04))] p-5 text-sm leading-6 text-brand-900 shadow-[0_14px_30px_rgba(49,141,255,0.10)]">
          <p className="font-medium">{services.find((service) => service.id === form.serviceId)?.shortDescription}</p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-800">
            Elija una fecha
            {submitAttempted && missingFields.appointmentDate ? <span className="ml-1 text-rose-600">*</span> : null}
          </span>
          <div
            className={`relative overflow-hidden rounded-2xl border bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100 ${
              submitAttempted && missingFields.appointmentDate ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-300"
            }`}
          >
            <input
              ref={dateInputRef}
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
              className="date-input"
            />
            <button
              type="button"
              onClick={openDatePicker}
              className="absolute inset-y-0 right-0 flex items-center border-l border-slate-200 bg-slate-50 px-4 text-slate-500 transition hover:bg-slate-100 hover:text-brand-700"
              aria-label="Abrir calendario"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                <path
                  fill="currentColor"
                  d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm12 8H5v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8ZM6 6a1 1 0 0 0-1 1v1h14V7a1 1 0 0 0-1-1H6Z"
                />
              </svg>
            </button>
          </div>
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-800">
            Elija una hora
            {submitAttempted && missingFields.appointmentTime ? <span className="ml-1 text-rose-600">*</span> : null}
          </span>
          <select
            required
            value={form.appointmentTime}
            onChange={(event) => {
              setError(null);
              setForm({ ...form, appointmentTime: event.target.value });
            }}
            className={`form-input ${submitAttempted && missingFields.appointmentTime ? "border-rose-300 ring-2 ring-rose-100" : ""}`}
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
        <span className="font-medium text-slate-800">
          Detalle de la necesidad
          {submitAttempted && missingFields.notes ? <span className="ml-1 text-rose-600">*</span> : null}
        </span>
        <textarea
          required
          rows={5}
          value={form.notes}
          onChange={(event) => {
            setError(null);
            setForm({ ...form, notes: event.target.value });
          }}
          className={`form-input min-h-[140px] resize-y ${submitAttempted && missingFields.notes ? "border-rose-300 ring-2 ring-rose-100" : ""}`}
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
        disabled={loading || services.length === 0}
        className="btn-primary w-full justify-center disabled:opacity-70"
      >
        {loading ? "Registrando cita..." : "Solicitar cita"}
      </button>
    </form>
  );
}
