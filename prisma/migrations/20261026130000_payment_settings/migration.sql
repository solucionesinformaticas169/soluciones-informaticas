CREATE TABLE "PaymentSettings" (
    "id" TEXT NOT NULL,
    "taxRatePercent" INTEGER NOT NULL DEFAULT 15,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentSettings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PaymentSettings_singleton_check" CHECK ("id" = 'main'),
    CONSTRAINT "PaymentSettings_tax_check" CHECK ("taxRatePercent" IN (12, 15))
);
INSERT INTO "PaymentSettings" ("id", "taxRatePercent", "updatedAt") VALUES ('main', 15, CURRENT_TIMESTAMP);
