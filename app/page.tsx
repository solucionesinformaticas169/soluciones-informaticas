import Link from "next/link";
import BrandMark from "@/app/components/BrandMark";
import { WhatsAppIcon } from "@/app/components/ContactIcons";
import FloatingPrompt from "@/app/components/FloatingPrompt";
import MobileMenu from "@/app/components/MobileMenu";
import {
  adminHighlights,
  company,
  processSteps,
  serviceCards,
  valuePoints,
  whatsappUrl
} from "@/lib/site";

export default function HomePage() {
  return (
    <main id="top" className="overflow-hidden">
      <FloatingPrompt />

      <section className="hero-shell">
        <div className="section pb-10 pt-6">
          <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/10 bg-[#0b1833]/95 px-4 py-4 shadow-[0_14px_40px_rgba(4,12,28,0.22)] backdrop-blur sm:px-6 lg:px-10">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
              <div className="flex flex-col gap-3">
                <div className="group relative transition duration-500 hover:-translate-y-1 hover:scale-[1.03]">
                  <div className="pointer-events-none absolute inset-0 rounded-[1.25rem] bg-[radial-gradient(circle_at_center,_rgba(49,141,255,0.3),_transparent_68%)] opacity-0 blur-xl transition duration-500 group-hover:opacity-100" />
                  <div className="relative">
                    <BrandMark width={170} priority />
                  </div>
                </div>
                <span className="h-[3px] w-32 rounded-full bg-brand-500 shadow-[0_0_24px_rgba(49,141,255,0.55)]" />
              </div>

              <MobileMenu />

              <nav className="hidden flex-wrap gap-3 text-sm text-slate-200 md:flex">
                <Link href="/agendar" className="nav-chip">
                  Agenda cita
                </Link>
                <a href="#servicios" className="nav-chip">
                  Servicios
                </a>
                <a href="#automatizacion" className="nav-chip">
                  Automatización
                </a>
                <a href="#contacto" className="nav-chip">
                  Contacto
                </a>
                <Link href="/admin/login" className="nav-chip">
                  Login
                </Link>
              </nav>
            </div>
          </header>

          <div className="h-[110px] sm:h-[118px]" />

          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex rounded-full border border-brand-400/30 bg-brand-300/10 px-4 py-2 text-sm font-medium text-brand-100 transition duration-300 hover:border-brand-300/70 hover:bg-brand-300/15 hover:shadow-[0_0_24px_rgba(49,141,255,0.22)]">
                {company.slogan}
              </span>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl xl:text-6xl">
                Creamos soluciones digitales que venden, automatizan y escalan contigo.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                Desarrollamos software, aplicaciones, automatizaciones, sistemas de citas e integraciones con
                inteligencia artificial para convertir procesos manuales en operaciones más claras, rápidas y
                rentables.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/agendar" className="btn-primary">
                  Agendar cita
                </Link>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3 font-semibold text-white transition hover:bg-[#20bd5a]"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  WhatsApp
                </a>
                <a href="#contacto" className="btn-ghost">
                  Solicitar información
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="hero-card">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-brand-200">Identidad visual</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">Una marca clara para tecnología profesional</h2>
                  </div>
                  <div className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300">
                    Base profesional
                  </div>
                </div>

                <div className="relative mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#09162f]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(49,141,255,0.35),_transparent_45%)]" />
                  <div className="flex h-[320px] items-center justify-center px-8">
                    <div className="group w-full max-w-[420px] rounded-[1.75rem] border border-white/10 bg-[#16284a] p-6 shadow-[0_30px_60px_rgba(3,10,23,0.28)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_36px_70px_rgba(3,10,23,0.34)]">
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] bg-[radial-gradient(circle_at_center,_rgba(49,141,255,0.26),_transparent_70%)] opacity-0 blur-2xl transition duration-500 group-hover:opacity-100" />
                        <div className="relative transition duration-500 group-hover:scale-[1.04] group-hover:-translate-y-1">
                          <BrandMark width={360} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {valuePoints.map((item) => (
                    <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <p className="text-sm leading-6 text-slate-200">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="servicios" className="section">
        <div className="section-heading">
          <span className="eyebrow">Servicios principales</span>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {serviceCards.map((service) => (
            <article key={service.title} className="feature-card">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-700">{service.eyebrow}</p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-950">{service.title}</h3>
              <p className="mt-4 leading-7 text-slate-600">{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section pt-0">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="deep-card">
            <span className="eyebrow text-brand-100">Propuesta de valor</span>
            <h2 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
              Presencia profesional, captación de clientes y base técnica escalable en una sola plataforma.
            </h2>
            <p className="mt-5 max-w-2xl leading-8 text-slate-300">
              La página no solo presenta tus servicios. También demuestra tu capacidad para integrar frontend,
              backend, base de datos, automatización de mensajes y operación administrativa sobre una misma solución.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-slate-300">Ideal para</p>
                <p className="mt-3 text-xl font-semibold text-white">Empresas, profesionales y negocios</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-slate-300">Resultado</p>
                <p className="mt-3 text-xl font-semibold text-white">Más orden, mejor atención y más conversión</p>
              </div>
            </div>
          </div>

          <div className="card">
            <span className="eyebrow">Proceso de trabajo</span>
            <div className="mt-6 space-y-6">
              {processSteps.map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 font-semibold text-brand-700">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-2 leading-7 text-slate-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="automatizacion" className="section pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(20,36,80,0.14)]">
            <span className="eyebrow">Agendamiento inteligente</span>
            <h2 className="mt-5 text-3xl font-semibold text-slate-950">Sistema de citas con seguimiento real</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Tus clientes pueden elegir un servicio, reservar una fecha y dejar sus datos. La solicitud queda
              registrada y luego puede activarse el envío de correo, WhatsApp de confirmación y recordatorios.
            </p>
            <div className="mt-8 grid gap-4">
              {[
                "Solicitud desde la web con datos completos del cliente",
                "Registro en PostgreSQL para seguimiento y gestión interna",
                "Confirmaciones y recordatorios por canales automáticos"
              ].map((item) => (
                <div key={item} className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(20,36,80,0.14)]">
            <span className="eyebrow">Panel administrativo</span>
            <h2 className="mt-5 text-3xl font-semibold text-slate-950">Operación centralizada para ti</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Esta base ya está preparada para continuar con autenticación, panel privado, reportes, gestión de
              servicios y crecimiento hacia una plataforma más amplia.
            </p>
            <ul className="mt-8 space-y-4">
              {adminHighlights.map((item) => (
                <li key={item} className="flex gap-3 text-slate-700">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
                  <span className="leading-7">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="contacto" className="section pb-4 pt-0">
        <div className="cta-banner">
          <div>
            <span className="eyebrow text-brand-100">Contacto</span>
            <h2 className="mt-5 max-w-3xl text-3xl font-semibold text-white sm:text-4xl">
              Si necesitas una solución digital profesional, aquí tienes una base real para avanzar.
            </h2>
            <p className="mt-5 max-w-2xl leading-8 text-slate-300">
              Desarrollamos software, aplicaciones, automatización, informática forense e IA con enfoque práctico:
              resolver procesos, mejorar atención y construir herramientas listas para operar.
            </p>
          </div>

          <div className="grid gap-4 lg:justify-items-end">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3 font-semibold text-white transition hover:bg-[#20bd5a]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              WhatsApp
            </a>
            <a
              href="#top"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-brand-300/60 hover:bg-white/10 hover:shadow-[0_18px_34px_rgba(49,141,255,0.16)]"
            >
              Volver arriba
            </a>
          </div>
        </div>
      </section>

      <footer className="pb-4 text-center text-sm text-brand-600">
        © 2026 Soluciones Informáticas. Todos los derechos reservados.
      </footer>
    </main>
  );
}
