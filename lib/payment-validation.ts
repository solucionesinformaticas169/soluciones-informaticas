import { z } from "zod";

export const MIN_PAYMENT_CENTS = 100;
export const MAX_PAYMENT_CENTS = 500000;

export function parseAmountCents(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return cents >= MIN_PAYMENT_CENTS && cents <= MAX_PAYMENT_CENTS ? cents : null;
}

export const paymentInputSchema = z.object({
  concept: z.string().trim().min(5, "Describe el concepto del pago (al menos 5 caracteres).").max(100, "Utiliza hasta 100 caracteres."),
  amount: z.string().refine((value) => parseAmountCents(value) !== null, "Ingresa un monto entre $1 y $5.000, con hasta dos decimales."),
  accepted: z.literal(true, { errorMap: () => ({ message: "Confirma el concepto y el monto para continuar." }) })
});

export function assessConfirmation(data: Record<string, unknown>, expected: {
  amountCents: number; clientTransactionId: string; providerTransactionId: string;
}): "APPROVED" | "CANCELLED" | "REVIEW" {
  if (String(data.clientTransactionId ?? "") !== expected.clientTransactionId ||
      Number(data.amount) !== expected.amountCents ||
      String(data.transactionId ?? "") !== expected.providerTransactionId ||
      String(data.currency ?? "").toUpperCase() !== "USD") return "REVIEW";
  if (Number(data.statusCode) === 3 && String(data.transactionStatus).toLowerCase() === "approved") return "APPROVED";
  if (Number(data.statusCode) === 2 && ["canceled", "cancelled"].includes(String(data.transactionStatus).toLowerCase())) return "CANCELLED";
  return "REVIEW";
}

export const paymentStatusLabels: Record<string, string> = {
  PENDING: "Pendiente de pago", VERIFYING: "Verificando pago", APPROVED: "Pago aprobado",
  CANCELLED: "Pago cancelado", REVIEW: "Pendiente de verificación"
};
