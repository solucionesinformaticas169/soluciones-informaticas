-- Retain payment totals, references and statuses; remove only the tax breakdown.
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_amount_check";
ALTER TABLE "Payment"
    DROP COLUMN "taxableCents",
    DROP COLUMN "taxCents",
    DROP COLUMN "taxRatePercent";
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_amount_check" CHECK ("amountCents" > 0);
DROP TABLE "PaymentSettings";
