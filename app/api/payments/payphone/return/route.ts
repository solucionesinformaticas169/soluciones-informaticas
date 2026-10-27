import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmPayment } from "@/lib/payphone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const transactionId = url.searchParams.get("id") ?? "";
  const clientId = url.searchParams.get("clientTransactionId") ?? "";
  if (!/^[1-9]\d{0,14}$/.test(transactionId) || !/^si-[a-f0-9-]{36}$/.test(clientId)) {
    return new NextResponse("Los datos de retorno del pago no son válidos.", { status: 400 });
  }
  const payment = await prisma.payment.findUnique({ where: { clientTransactionId: clientId } });
  if (!payment) return new NextResponse("No se encontró el intento de pago.", { status: 404 });
  try {
    await confirmPayment(payment.id, transactionId);
  } catch {
    // The receipt stays pending if the database or provider configuration is unavailable.
  }
  return new NextResponse(null, {
    status: 303, headers: { Location: `/pagos/resultado/${payment.id}`, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" }
  });
}
