import Link from "next/link";
import { logoutAction } from "@/app/admin/(dashboard)/actions";
import { requireAdminSession } from "@/lib/auth";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();

  return (
    <main className="section">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-700">Panel administrativo</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Soluciones Informaticas</h1>
          <p className="mt-2 text-sm text-slate-600">Sesion activa: {session.email}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/admin" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
            Dashboard
          </Link>
          <Link href="/admin/appointments" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
            Citas
          </Link>
          <Link href="/admin/services" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
            Servicios
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
              Cerrar sesion
            </button>
          </form>
        </div>
      </div>

      {children}
    </main>
  );
}
