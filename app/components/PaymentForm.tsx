"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { paymentInputSchema, parseAmountCents } from "@/lib/payment-validation";

type Checkout = { paymentId: string; amountCents: number; box: Record<string, string | number> };
type BoxWindow = Window & { PPaymentButtonBox?: new (options: Record<string, string | number>) => { render: (id: string) => void } };
const money = (cents: number) => new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(cents / 100);

function PayphoneBox({ checkout }: { checkout: Checkout }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const mounted = useRef(false);
  const mountId = `payphone-${checkout.paymentId}`;
  useEffect(() => {
    if (!ready || mounted.current) return;
    const Box = (window as BoxWindow).PPaymentButtonBox;
    if (!Box) { setError(true); return; }
    try {
      new Box(checkout.box).render(mountId);
      mounted.current = true;
    } catch { setError(true); }
  }, [ready, checkout, mountId]);
  return <>
    <link rel="stylesheet" href="https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.css" />
    <Script src="https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js" type="module" onReady={() => setReady(true)} onError={() => setError(true)} />
    {!ready && !error && <p role="status" className="py-6 text-brand-700">Cargando formulario seguro de PayPhone...</p>}
    {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-red-700">No se pudo cargar PayPhone. Recarga esta página antes de introducir los datos de tu tarjeta. Si ya intentaste pagar, consulta primero el estado.</p>}
    <div id={mountId} className="min-w-0 overflow-x-auto" />
  </>;
}

export default function PaymentForm({ enabled, testMode }: {
  enabled: boolean; testMode: boolean;
}) {
  const [values, setValues] = useState({ concept: "", amount: "", accepted: false });
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const notice = useRef<HTMLParagraphElement>(null);
  const amount = parseAmountCents(values.amount);
  function field(name: keyof typeof values) {
    return {
      id: name, name, value: String(values[name]),
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setValues((current) => ({ ...current, [name]: event.target.value }));
        setErrors((current) => ({ ...current, [name]: undefined }));
      },
      className: `form-input mt-2 ${errors[name] ? "border-red-500" : ""}`,
      "aria-invalid": !!errors[name], "aria-describedby": errors[name] ? `${name}-error` : undefined
    };
  }
  function error(name: string) {
    return errors[name] ? <span id={`${name}-error`} className="mt-1 block text-sm text-red-600">{errors[name]?.[0]}</span> : null;
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !enabled) return;
    const parsed = paymentInputSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      setMessage("Completa y revisa los campos marcados antes de continuar.");
      requestAnimationFrame(() => notice.current?.focus());
      return;
    }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const data = await response.json();
      if (!response.ok) {
        setErrors(data.fields ?? {});
        throw new Error(data.message || "No se pudo preparar el pago.");
      }
      setCheckout(data);
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "No se pudo conectar. Intenta nuevamente."); }
    finally { setBusy(false); }
  }
  return <section className="card min-w-0 p-5 sm:p-8">
    <span className="eyebrow">{checkout ? "Pago seguro" : "Datos del pago"}</span>
    <h2 className="mt-4 text-2xl font-semibold">{checkout ? "Completa tu pago con PayPhone" : "Ingresa el valor acordado"}</h2>
    {testMode && <p role="status" className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">Configuración de pruebas. Usa únicamente los datos de prueba autorizados por PayPhone; esta etiqueta no convierte credenciales reales en credenciales de prueba.</p>}
    {!enabled && <p role="status" className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-brand-800">Estamos preparando los pagos en línea. Por ahora, coordina tu pago con nosotros por WhatsApp.</p>}
    {checkout ? <div className="mt-6 space-y-6">
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
        <p className="text-sm text-brand-800">{values.concept}</p>
        <p className="mt-2 text-3xl font-semibold text-brand-700">{money(checkout.amountCents)}</p>
        <p className="mt-2 text-sm text-slate-600">Total en USD. El pago solo se registra como aprobado después de verificarlo con PayPhone.</p>
      </div>
      <PayphoneBox checkout={checkout} />
      <p className="text-sm leading-6 text-slate-600">Ingresa los datos del titular directamente en PayPhone. No almacenamos tu tarjeta ni su código de seguridad.</p>
      <Link href={`/pagos/resultado/${checkout.paymentId}`} className="inline-flex font-semibold text-brand-700 underline">Consultar estado de este pago</Link>
      <p className="text-sm leading-6 text-slate-500">No repitas un pago si ya lo realizaste. Consulta su estado o contacta con nosotros utilizando la referencia del intento.</p>
    </div> : <form onSubmit={submit} noValidate className="mt-6 space-y-5">
      <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
        <div><label htmlFor="concept" className="font-medium">Concepto o referencia *</label><textarea {...field("concept")} rows={2} required maxLength={100} placeholder="Indica el servicio, anticipo o referencia de tu cotización" />{error("concept")}</div>
        <div><label htmlFor="amount" className="font-medium">Monto total en dólares (USD) *</label><input {...field("amount")} inputMode="decimal" required placeholder="0.00" /><p className="mt-1 text-xs text-slate-500">Entre $1 y $5.000. Ingresa el valor total acordado. La página cobrará exactamente ese monto.</p>{error("amount")}</div>
        {amount !== null && <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 text-brand-900">
          <div className="flex justify-between gap-4 text-lg font-semibold"><span>Total a pagar</span><span>{money(amount)}</span></div>
        </div>}
        <div><label className="flex items-start gap-3 text-sm leading-6 text-slate-600"><input className="mt-1 h-5 w-5 shrink-0 accent-blue-600" type="checkbox" checked={values.accepted} onChange={(event) => setValues({ ...values, accepted: event.target.checked })} aria-invalid={!!errors.accepted} aria-describedby={errors.accepted ? "accepted-error" : undefined} />Confirmo que el concepto y el monto corresponden al servicio acordado.</label>{error("accepted")}</div>
        <button type="submit" className="btn-primary w-full justify-center disabled:cursor-not-allowed" disabled={busy || !enabled}>{busy ? "Preparando pago..." : "Continuar a PayPhone"}</button>
      </fieldset>
      {message && <p ref={notice} tabIndex={-1} role="alert" className="rounded-2xl bg-red-50 p-4 text-red-700">{message}</p>}
      <p className="text-xs leading-5 text-slate-500">El registro del pago no constituye una factura tributaria ni sustituye la cotización del servicio.</p>
      <p className="text-xs leading-5 text-slate-500">Los datos del titular se completan directamente en PayPhone, en el siguiente paso.</p>
    </form>}
  </section>;
}
