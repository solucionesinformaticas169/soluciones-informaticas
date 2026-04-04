CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_active_date_key"
ON "Appointment"("date")
WHERE "status" IN ('PENDING', 'CONFIRMED');
