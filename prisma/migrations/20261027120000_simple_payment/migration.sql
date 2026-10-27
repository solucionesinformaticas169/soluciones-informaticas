-- Preserve any previous customer data, but do not require it for general payments.
ALTER TABLE "Payment"
    ALTER COLUMN "fullName" DROP NOT NULL,
    ALTER COLUMN "email" DROP NOT NULL,
    ALTER COLUMN "phone" DROP NOT NULL,
    ALTER COLUMN "serviceName" DROP NOT NULL;
