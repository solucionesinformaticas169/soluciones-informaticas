import "server-only";
import { prisma } from "@/lib/prisma";
import { assessConfirmation } from "@/lib/payment-validation";

const CONFIRM_URL = "https://paymentbox.payphonetodoesposible.com/api/confirm";

export function getPayphoneConfig() {
  const read = (key: string) => process.env[key]?.trim() ?? "";
  const token = read("PAYPHONE_TOKEN");
  const storeId = read("PAYPHONE_STORE_ID");
  const environment = read("PAYPHONE_ENVIRONMENT");
  if (read("PAYPHONE_ENABLED") !== "true" || !token || !storeId ||
      !["test", "production"].includes(environment)) return null;
  return { token, storeId, environment };
}

export async function confirmPayment(paymentId: string, transactionId: string) {
  const config = getPayphoneConfig();
  if (!config) throw new Error("PayPhone no está disponible.");
  const now = new Date();
  // A persistent lease prevents concurrent callbacks from confirming the same charge.
  const claim = await prisma.payment.updateMany({
    where: {
      id: paymentId,
      AND: [
        { OR: [{ returnTransactionId: null }, { returnTransactionId: transactionId }] },
        { OR: [
          { status: "PENDING" },
          { status: "REVIEW", updatedAt: { lte: new Date(now.getTime() - 15000) } },
          { status: "VERIFYING", verificationUntil: { lt: now } }
        ] }
      ]
    },
    data: { status: "VERIFYING", returnTransactionId: transactionId, verificationUntil: new Date(now.getTime() + 45000) }
  });
  if (!claim.count) return;
  const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
  try {
    const response = await fetch(CONFIRM_URL, {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(12000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.token}` },
      body: JSON.stringify({ id: Number(transactionId), clientTxId: payment.clientTransactionId })
    });
    const data: unknown = await response.json();
    if (!response.ok || !data || typeof data !== "object" || Array.isArray(data)) throw new Error("Unconfirmed response");
    const status = assessConfirmation(data as Record<string, unknown>, {
      amountCents: payment.amountCents, clientTransactionId: payment.clientTransactionId,
      providerTransactionId: transactionId
    });
    await prisma.payment.updateMany({
      where: { id: paymentId, status: "VERIFYING", verificationUntil: payment.verificationUntil },
      data: {
        status, verificationUntil: null, paidAt: status === "APPROVED" ? new Date() : null,
        providerTransactionId: status === "APPROVED" ? transactionId : null,
        failureReason: status === "REVIEW" ? "El proveedor no devolvió una aprobación verificable. No vuelvas a pagar; consulta el estado." : null
      }
    });
  } catch {
    // A timeout is not a rejected charge. Preserve it for reconciliation, never ask to pay twice.
    await prisma.payment.updateMany({
      where: { id: paymentId, status: "VERIFYING", verificationUntil: payment.verificationUntil },
      data: { status: "REVIEW", verificationUntil: null, failureReason: "No fue posible verificar el pago. Reintenta la verificación, no el cobro." }
    });
  }
}
