import AdminAppointmentsFilters from "@/app/admin/(dashboard)/appointments/AdminAppointmentsFilters";
import { updateAppointmentStatusAction } from "@/app/admin/(dashboard)/actions";
import { getAdminAppointments } from "@/lib/data";

type AdminAppointmentsPageProps = {
  searchParams?: {
    from?: string;
    to?: string;
  };
};

export default async function AdminAppointmentsPage({ searchParams }: AdminAppointmentsPageProps) {
  const from = searchParams?.from || "";
  const to = searchParams?.to || "";
  const hasInvalidRange = Boolean(from && to && to < from);
  const hasDateFilter = Boolean(from && to);
  const appointments = hasInvalidRange
    ? []
    : await getAdminAppointments({
        from,
        to,
        limit: hasDateFilter ? undefined : 6
      });

  function formatFilterDate(date: string) {
    const [year, month, day] = date.split("-").map(Number);
    return new Intl.DateTimeFormat("es-EC", { dateStyle: "medium" }).format(new Date(year, month - 1, day));
  }

  const formattedRange =
    hasDateFilter && !hasInvalidRange
      ? from === to
        ? formatFilterDate(from)
        : `${formatFilterDate(from)} al ${formatFilterDate(to)}`
      : null;

  function getChannelStatusLabel(
    notifications: Array<{ channel: string; status: string; createdAt?: Date }>
  ) {
    function normalizeStatus(channel: string) {
      const channelNotifications = notifications
        .filter((notification) => notification.channel === channel)
        .sort((first, second) => {
          const firstTime = first.createdAt ? new Date(first.createdAt).getTime() : 0;
          const secondTime = second.createdAt ? new Date(second.createdAt).getTime() : 0;
          return secondTime - firstTime;
        });

      const latest = channelNotifications[0];

      if (!latest) return "sin registro";
      if (latest.status === "SENT") return "enviado";
      if (latest.status === "SKIPPED") return "no configurado";
      if (latest.status === "FAILED") return "fallido";
      if (latest.status === "PENDING") return "pendiente";
      return latest.status.toLowerCase();
    }

    return {
      email: normalizeStatus("EMAIL"),
      whatsapp: normalizeStatus("WHATSAPP")
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-brand-700">Gestion de citas</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">Agenda y seguimiento</h2>
        <p className="mt-2 text-sm text-slate-600">
          Filtra por rango de fechas para revisar las citas registradas y su estado.
        </p>
      </div>

      <AdminAppointmentsFilters initialFrom={from} initialTo={to} />

      {hasInvalidRange ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-soft">
          La fecha hasta no puede ser anterior a la fecha desde.
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-soft">
        {hasInvalidRange
          ? "Corrige el rango de fechas para consultar las citas."
          : !hasDateFilter
          ? `Mostrando las ultimas ${appointments.length} citas registradas.`
          : appointments.length === 1
          ? `Se encontro 1 cita dentro del rango ${formattedRange}.`
          : `Se encontraron ${appointments.length} citas dentro del rango ${formattedRange}.`}
      </div>

      <div className="space-y-4">
        {appointments.length === 0 && !hasInvalidRange ? (
          <div className="card">
            <p className="text-sm leading-7 text-slate-600">
              {!hasDateFilter
                ? "No hay citas registradas. Puedes probar con otras fechas."
                : `No hay citas registradas para ${formattedRange}. Puedes probar con otras fechas.`}
            </p>
          </div>
        ) : null}

        {appointments.map((appointment) => (
          (() => {
            const channelStatus = getChannelStatusLabel(appointment.notifications);

            return (
              <article key={appointment.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-950">{appointment.fullName}</h3>
                    <p className="mt-2 text-sm text-slate-600">{appointment.serviceName}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short" }).format(appointment.date)}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {appointment.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                    <p>Correo: {appointment.email}</p>
                    <p>Telefono: {appointment.phone}</p>
                    <p>Servicio relacionado: {appointment.service.name}</p>
                    <p>Total de eventos: {appointment.notifications.length}</p>
                    <p>Estado correo: {channelStatus.email}</p>
                    <p>Estado WhatsApp: {channelStatus.whatsapp}</p>
                    <p className="md:col-span-2">Notas: {appointment.notes || "Sin notas adicionales."}</p>
                  </div>

                  <form action={updateAppointmentStatusAction} className="flex flex-wrap gap-3">
                    <input type="hidden" name="appointmentId" value={appointment.id} />
                    <button
                      type="submit"
                      name="status"
                      value="CONFIRMED"
                      className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Confirmar
                    </button>
                    <button
                      type="submit"
                      name="status"
                      value="PENDING"
                      className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Pendiente
                    </button>
                    <button
                      type="submit"
                      name="status"
                      value="CANCELLED"
                      className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Cancelar
                    </button>
                  </form>
                </div>
              </article>
            );
          })()
        ))}
      </div>
    </div>
  );
}
