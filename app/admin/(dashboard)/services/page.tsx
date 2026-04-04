import {
  createServiceAction,
  seedDefaultServicesAction,
  toggleServiceStatusAction
} from "@/app/admin/(dashboard)/actions";
import { getAdminServices } from "@/lib/data";

export default async function AdminServicesPage() {
  const services = await getAdminServices();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <section className="space-y-4">
        <div>
          <p className="text-sm font-medium text-brand-700">Servicios</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">Catalogo administrable</h2>
        </div>

        <div className="space-y-4">
          {services.length === 0 ? (
            <div className="card">
              <p className="text-slate-600">Todavia no hay servicios guardados en base de datos.</p>
            </div>
          ) : null}

          {services.map((service) => (
            <article key={service.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-950">{service.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">{service.slug}</p>
                  <p className="mt-3 leading-7 text-slate-600">{service.shortDescription || "Sin descripcion corta."}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    service.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {service.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-slate-500">Orden: {service.sortOrder}</p>
                <form action={toggleServiceStatusAction}>
                  <input type="hidden" name="serviceId" value={service.id} />
                  <input type="hidden" name="isActive" value={service.isActive ? "true" : "false"} />
                  <button type="submit" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
                    {service.isActive ? "Desactivar" : "Activar"}
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="space-y-6">
        <section className="card">
          <h3 className="text-2xl font-semibold text-slate-950">Crear o actualizar servicio</h3>
          <form action={createServiceAction} className="mt-6 space-y-4">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-800">Nombre</span>
              <input name="name" className="form-input" placeholder="Automatizacion de procesos" required />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-800">Slug</span>
              <input name="slug" className="form-input" placeholder="automatizacion-de-procesos" required />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-800">Descripcion corta</span>
              <textarea
                name="shortDescription"
                className="form-input min-h-[100px] resize-y"
                placeholder="Resumen visible en el formulario o en listados."
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-800">Descripcion larga</span>
              <textarea
                name="description"
                className="form-input min-h-[140px] resize-y"
                placeholder="Descripcion completa del servicio."
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-800">Orden</span>
              <input name="sortOrder" type="number" min="0" defaultValue="0" className="form-input" required />
            </label>

            <button type="submit" className="btn-primary w-full justify-center">
              Guardar servicio
            </button>
          </form>
        </section>

        <section className="deep-card">
          <span className="eyebrow text-brand-100">Carga inicial</span>
          <h3 className="mt-5 text-2xl font-semibold text-white">Sembrar servicios recomendados</h3>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Si la base esta vacia o quieres recuperar el catalogo base, puedes cargar los servicios iniciales con un
            solo clic.
          </p>
          <form action={seedDefaultServicesAction} className="mt-6">
            <button type="submit" className="btn-secondary">
              Cargar servicios base
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
