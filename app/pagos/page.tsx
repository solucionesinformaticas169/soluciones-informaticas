import Link from "next/link";
import BrandMark from "@/app/components/BrandMark";
import PaymentForm from "@/app/components/PaymentForm";
import { getPayphoneConfig } from "@/lib/payphone";
import { whatsappUrl } from "@/lib/site";

export const metadata = { title: "Pagos | Soluciones Informáticas" };
export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const config = getPayphoneConfig();
  return (
    <main className="section">
      <Link href="/" className="text-sm font-medium text-brand-700 hover:text-brand-800">&lt; Volver al inicio</Link>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="deep-card p-6 text-white sm:p-8 lg:sticky lg:top-8">
          <BrandMark width={240} className="h-auto w-44 sm:w-60" />
          <span className="eyebrow mt-6 lg:mt-8">Pagos en línea</span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Tu próximo paso, con un pago seguro.</h1>
          <p className="mt-5 leading-7 text-slate-200">Paga el servicio o anticipo que hayas coordinado con nosotros. Indica el concepto y el monto acordado en dólares.</p>
          <ol className="mt-8 hidden space-y-4 text-sm leading-6 text-slate-200 lg:block">
            <li>01. Indica el concepto y el monto acordado.</li>
            <li>02. Revisa el total e ingresa a la Cajita de PayPhone.</li>
            <li>03. Consulta el resultado verificado de tu transacción.</li>
          </ol>
          <p className="mt-8 hidden border-t border-white/15 pt-6 text-sm leading-6 text-slate-300 lg:block">Los datos de tu tarjeta se ingresan directamente en PayPhone. No almacenamos números de tarjeta ni códigos de seguridad.</p>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex text-sm font-semibold text-green-400 hover:text-green-300">¿Necesitas confirmar el monto? Escríbenos por WhatsApp</a>
        </aside>
        <PaymentForm enabled={!!config} testMode={config?.environment === "test"} />
      </div>
    </main>
  );
}
