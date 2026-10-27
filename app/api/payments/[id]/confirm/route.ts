import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmPayment } from "@/lib/payphone";
import { isPaymentSameOrigin } from "@/lib/payment-request";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!isPaymentSameOrigin(request)) return new NextResponse(null, { status: 403 });
  if (!/^[a-f0-9-]{36}$/.test(params.id)) return new NextResponse(null, { status: 404 });
  try {
    const payment = await prisma.payment.findUnique({ where: { id: params.id } });
    if (!payment?.returnTransactionId) return NextResponse.json({ message: "Todavía no hemos recibido el resultado de PayPhone." }, { status: 409 });
    if (payment.updatedAt.getTime() > Date.now() - 15000 && payment.status === "REVIEW") {
      return NextResponse.json({ message: "Espera unos segundos antes de volver a verificar." }, { status: 429 });
    }
    await confirmPayment(payment.id, payment.returnTransactionId);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "No se pudo verificar. No repitas el pago; contacta con nosotros." }, { status: 503 });
  }
}
