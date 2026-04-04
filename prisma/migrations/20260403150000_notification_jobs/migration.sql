DO $$
BEGIN
  CREATE TYPE "NotificationJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "NotificationJob" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "template" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "payload" JSONB,
  "status" "NotificationJobStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "processedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NotificationJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NotificationJob_status_runAt_idx" ON "NotificationJob"("status", "runAt");
CREATE INDEX IF NOT EXISTS "NotificationJob_appointmentId_idx" ON "NotificationJob"("appointmentId");
CREATE INDEX IF NOT EXISTS "NotificationJob_channel_template_idx" ON "NotificationJob"("channel", "template");

DO $$
BEGIN
  ALTER TABLE "NotificationJob"
    ADD CONSTRAINT "NotificationJob_appointmentId_fkey"
    FOREIGN KEY ("appointmentId")
    REFERENCES "Appointment"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
