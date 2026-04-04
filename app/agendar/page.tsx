import Link from "next/link";
import AppointmentForm from "@/app/components/AppointmentForm";
import BrandMark from "@/app/components/BrandMark";
import { MailIcon, WhatsAppIcon } from "@/app/components/ContactIcons";
import { getActiveServices } from "@/lib/data";
import { company, valuePoints, whatsappUrl } from "@/lib/site";

export default async function AgendarPage() {
  const services = await getActiveServices();

  return (
    <main className="section">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800">
          <span>&lt;</span>
          <span>Volver al inicio</span>
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="deep-card">
            <BrandMark width={260} />
            <span className="eyebrow text-brand-100">Reserva tu espacio</span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white">Agendamiento profesional</h1>
            <p className="mt-4 leading-8 text-slate-300">
              Este modulo te permite ofrecer una atencion ordenada desde la web. Cada solicitud puede guardarse en
              PostgreSQL, gestionarse desde panel administrativo y conectarse despues con automatizaciones reales.
            </p>
            <div className="mt-8 grid gap-4">
              {valuePoints.map((item) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm leading-6 text-slate-200">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <span className="eyebrow">Contacto rapido</span>
            <p className="mt-4 leading-7 text-slate-600">
              Si prefieres coordinar primero por mensaje o por correo, puedes escribir directamente y luego pasamos
              a la reserva formal.
            </p>
            <div className="mt-6 grid gap-4">
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn-secondary justify-center gap-2">
                <WhatsAppIcon className="h-5 w-5" />
                WhatsApp
              </a>
              <a
                href={`mailto:${company.email}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-4 text-center font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
              >
                <MailIcon className="h-5 w-5" />
                Envia un correo
              </a>
            </div>
          </div>
        </div>

        <AppointmentForm
          services={services.map((service) => ({
            id: service.id,
            name: service.name,
            shortDescription: service.shortDescription
          }))}
        />
      </div>
    </main>
  );
}
