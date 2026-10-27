import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { paymentStatusLabels } from "@/lib/payment-validation";
import PaymentVerification from "@/app/components/PaymentVerification";
import { whatsappUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Estado del pago | Soluciones Informáticas", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function PaymentResult({ params }: { params: { id: string } }) {
  if (!/^[a-f0-9-]{36}$/.test(params.id)) notFound();
  const payment = await prisma.payment.findUnique({ where: { id: params.id } });
  if (!payment) notFound();
  const approved = payment.status === "APPROVED";
  return <main className="section max-w-3xl">
    <div className="card">
      <span className="eyebrow">Resultado de tu transacción</span>
      <h1 className={`mt-5 text-3xl font-semibold ${approved ? "text-green-700" : "text-brand-800"}`}>{paymentStatusLabels[payment.status]}</h1>
      <p className="mt-4 leading-7 text-slate-600">{approved ? "Gracias. Verificamos tu pago con PayPhone y quedó registrado correctamente." : payment.status === "CANCELLED" ? "PayPhone informó que este pago fue cancelado." : "Todavía no tenemos una aprobación verificada. Si ya pagaste, no realices otro cobro: verifica el estado o contáctanos."}</p>
      <dl className="mt-6 space-y-4 rounded-2xl bg-slate-50 p-5">
        <div><dt className="text-sm text-slate-500">Total</dt><dd className="text-3xl font-semibold">{new Intl.NumberFormat("es-EC", { style: "currency", currency: payment.currency }).format(payment.amountCents / 100)}</dd></div>
        <div><dt className="text-sm text-slate-500">Concepto</dt><dd className="break-words">{payment.concept}</dd></div>
        <div><dt className="text-sm text-slate-500">Referencia de tu intento</dt><dd className="break-all font-mono text-sm">{payment.id}</dd></div>
        {approved && <div><dt className="text-sm text-slate-500">Transacción PayPhone</dt><dd>{payment.providerTransactionId}</dd></div>}
      </dl>
      {!["APPROVED", "CANCELLED"].includes(payment.status) && <PaymentVerification id={payment.id} />}
      <div className="mt-8 flex flex-wrap gap-5 text-sm font-semibold"><Link href="/" className="text-brand-700">Volver al inicio</Link><a href={whatsappUrl} target="_blank" rel="noreferrer" className="text-green-700">Ayuda por WhatsApp</a></div>
    </div>
  </main>;
}
