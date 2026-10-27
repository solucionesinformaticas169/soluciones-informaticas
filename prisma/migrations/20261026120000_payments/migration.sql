CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'VERIFYING', 'APPROVED', 'CANCELLED', 'REVIEW');

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "clientTransactionId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "providerTransactionId" TEXT,
    "returnTransactionId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "taxableCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL,
    "taxRatePercent" DECIMAL(5,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "verificationUntil" TIMESTAMP(3),
    "failureReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Payment_amount_check" CHECK ("amountCents" > 0 AND "taxCents" >= 0 AND "taxableCents" >= 0 AND "taxCents" <= "amountCents")
);
CREATE UNIQUE INDEX "Payment_clientTransactionId_key" ON "Payment"("clientTransactionId");
CREATE UNIQUE INDEX "Payment_providerTransactionId_key" ON "Payment"("providerTransactionId");
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");
CREATE INDEX "Payment_requestKey_createdAt_idx" ON "Payment"("requestKey", "createdAt");
