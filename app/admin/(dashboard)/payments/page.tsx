import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { paymentStatusLabels } from "@/lib/payment-validation";
import type { PaymentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminPayments({ searchParams }: { searchParams: { page?: string; status?: string } }) {
  if ((process.env.AUTH_SECRET?.trim().length ?? 0) < 32) {
    return <section className="card"><h2 className="text-2xl font-semibold">Pagos</h2><p className="mt-4 text-slate-600">Configura una clave AUTH_SECRET de al menos 32 caracteres para proteger el historial de pagos.</p></section>;
  }
  await requireAdminSession();
  const page = Math.min(10000, Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1));
  const status = searchParams.status && Object.hasOwn(paymentStatusLabels, searchParams.status) ? searchParams.status as PaymentStatus : undefined;
  const where = status ? { status } : {};
  let payments;
  let count;
  try {
    [payments, count] = await Promise.all([
      prisma.payment.findMany({ where, orderBy: { createdAt: "desc" }, take: 20, skip: (page - 1) * 20 }),
      prisma.payment.count({ where })
    ]);
  } catch {
    return <section className="card"><h2 className="text-2xl font-semibold">Pagos</h2><p className="mt-4 text-red-700">No se pudo cargar el historial. Comprueba la conexión y que la migración de pagos esté aplicada.</p></section>;
  }
  const date = (value: Date) => new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Guayaquil" }).format(value);
  const pageUrl = (target: number) => `/admin/payments?page=${target}${status ? `&status=${status}` : ""}` as const;
  return <section className="card">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><span className="eyebrow">PayPhone</span><h2 className="mt-3 text-2xl font-semibold">Historial de pagos</h2><p className="mt-2 text-sm text-slate-600">{count} registros. Solo «Pago aprobado» representa un cobro verificado.</p></div>
      <form className="flex gap-2"><label className="sr-only" htmlFor="payment-status">Estado</label><select id="payment-status" name="status" defaultValue={status ?? ""} className="form-input"><option value="">Todos los estados</option>{Object.entries(paymentStatusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><button className="btn-primary" type="submit">Filtrar</button></form>
    </div>
    <div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-slate-500"><tr>{["Fecha / referencia", "Concepto", "Total USD", "Estado"].map((label) => <th className="px-3 py-4" key={label}>{label}</th>)}</tr></thead>
      <tbody>{payments.map((payment) => <tr key={payment.id} className="border-b border-slate-100 align-top">
        <td className="min-w-[170px] px-3 py-4">{date(payment.createdAt)}<span className="mt-2 block break-all font-mono text-xs text-slate-500">{payment.id}</span>{payment.providerTransactionId && <span className="mt-2 block text-xs">PayPhone: {payment.providerTransactionId}</span>}</td>
        <td className="min-w-[180px] px-3 py-4"><p className="whitespace-pre-wrap break-words">{payment.concept}</p></td>
        <td className="whitespace-nowrap px-3 py-4 font-semibold">${(payment.amountCents / 100).toFixed(2)}</td>
        <td className="min-w-[180px] px-3 py-4"><span className={`inline-block rounded-full px-3 py-1 font-medium ${payment.status === "APPROVED" ? "bg-green-50 text-green-800" : "bg-brand-50 text-brand-800"}`}>{paymentStatusLabels[payment.status]}</span>{payment.paidAt && <p className="mt-2 text-xs">Confirmado: {date(payment.paidAt)}</p>}{payment.failureReason && <p className="mt-2 text-xs text-slate-600">{payment.failureReason}</p>}</td>
      </tr>)}</tbody></table>{!payments.length && <p className="py-8 text-slate-500">No hay pagos para mostrar.</p>}</div>
    <nav aria-label="Páginas del historial" className="mt-6 flex items-center justify-between gap-4 text-sm font-medium text-brand-700">{page > 1 ? <Link href={pageUrl(page - 1)}>Anterior</Link> : <span />}<span>Página {page}</span>{page * 20 < count ? <Link href={pageUrl(page + 1)}>Siguiente</Link> : <span />}</nav>
  </section>;
}
