import { createHmac, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayphoneConfig } from "@/lib/payphone";
import { paymentInputSchema, parseAmountCents } from "@/lib/payment-validation";
import { isPaymentSameOrigin } from "@/lib/payment-request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isPaymentSameOrigin(request)) {
    return NextResponse.json({ message: "Solicitud no permitida." }, { status: 403 });
  }
  const config = getPayphoneConfig();
  if (!config) return NextResponse.json({ message: "Los pagos en línea todavía no están habilitados." }, { status: 503 });
  try {
    const body = await request.text();
    if (body.length > 5000) return NextResponse.json({ message: "Solicitud demasiado extensa." }, { status: 413 });
    const parsed = paymentInputSchema.safeParse(JSON.parse(body));
    if (!parsed.success) return NextResponse.json({ message: "Revisa los campos del formulario.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    const input = parsed.data;
    const amountCents = parseAmountCents(input.amount)!;
    const ip = (request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
    const requestKey = createHmac("sha256", config.token).update(ip).digest("hex");
    const payment = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${requestKey}))::text`;
      const attempts = await tx.payment.count({ where: { requestKey, createdAt: { gte: new Date(Date.now() - 600000) } } });
      if (attempts >= 5) return null;
      return tx.payment.create({ data: {
        clientTransactionId: `si-${randomUUID()}`, requestKey,
        concept: input.concept, amountCents
      } });
    });
    if (!payment) return NextResponse.json({ message: "Has realizado varios intentos. Espera diez minutos antes de iniciar otro pago." }, { status: 429 });
    return NextResponse.json({
      paymentId: payment.id, amountCents,
      box: {
        token: config.token, storeId: config.storeId, clientTransactionId: payment.clientTransactionId,
        amount: amountCents, amountWithoutTax: amountCents,
        currency: "USD", reference: payment.concept,
        lang: "es", defaultMethod: "card", timeZone: -5
      }
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
    return NextResponse.json({ message: "No se pudo preparar el pago. No se ha iniciado ningún cobro." }, { status: 503 });
  }
}
