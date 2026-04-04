import Link from "next/link";
import { getAdminDashboardData } from "@/lib/data";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  const stats = [
    { label: "Citas totales", value: data.appointmentsCount },
    { label: "Pendientes", value: data.pendingCount },
    { label: "Confirmadas", value: data.confirmedCount },
    { label: "Servicios", value: data.servicesCount }
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="card">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{stat.value}</p>
          </article>
        ))}
      </div>

      <section className="card mx-auto w-full max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand-700">Actividad reciente</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Ultimas citas registradas</h2>
          </div>
          <Link href="/admin/appointments" className="text-sm font-medium text-brand-700">
            Ver todas
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {data.recentAppointments.map((appointment) => (
            <article key={appointment.id} className="rounded-3xl border border-slate-200 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">{appointment.fullName}</h3>
                  <p className="mt-1 text-sm text-slate-600">{appointment.serviceName}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {appointment.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short" }).format(appointment.date)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
