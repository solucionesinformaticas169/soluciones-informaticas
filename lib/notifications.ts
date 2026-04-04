import { randomUUID } from "node:crypto";
import path from "node:path";
import type { Appointment, NotificationStatus, Prisma } from "@prisma/client";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

type NotificationChannel = "EMAIL" | "WHATSAPP";
type NotificationJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
type AppointmentEmailTemplate = "APPOINTMENT_RECEIVED" | "APPOINTMENT_CONFIRMED" | "APPOINTMENT_CANCELLED";
type NotificationJobTemplate = AppointmentEmailTemplate | "WHATSAPP_APPOINTMENT_RECEIVED";

type NotificationJobRecord = {
  id: string;
  appointmentId: string;
  channel: NotificationChannel;
  template: NotificationJobTemplate;
  target: string;
  status: NotificationJobStatus;
  attempts: number;
  maxAttempts: number;
  runAt: Date;
  lockedAt: Date | null;
};

type MailContent = {
  subject: string;
  text: string;
  html: string;
};

const STALE_JOB_WINDOW_MS = 10 * 60 * 1000;
const BASE_RETRY_DELAY_MS = 60 * 1000;

let infrastructurePromise: Promise<void> | null = null;

function formatAppointmentDate(date: Date) {
  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(date);
}

function getMailerConfig() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return {
    transporter: nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }),
    from: process.env.MAIL_FROM || process.env.SMTP_USER
  };
}

async function ensureNotificationInfrastructure() {
  if (!infrastructurePromise) {
    infrastructurePromise = (async () => {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          CREATE TYPE "NotificationJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END $$;
      `);

      await prisma.$executeRawUnsafe(`
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
          CONSTRAINT "NotificationJob_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "NotificationJob_appointmentId_fkey"
            FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id")
            ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);

      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "NotificationJob_status_runAt_idx" ON "NotificationJob"("status", "runAt");`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "NotificationJob_appointmentId_idx" ON "NotificationJob"("appointmentId");`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "NotificationJob_channel_template_idx" ON "NotificationJob"("channel", "template");`
      );
    })().catch((error) => {
      infrastructurePromise = null;
      throw error;
    });
  }

  await infrastructurePromise;
}

async function logNotification(
  appointmentId: string,
  channel: NotificationChannel,
  target: string,
  subject: string,
  status: NotificationStatus,
  payload?: Record<string, unknown> | null,
  error?: string | null
) {
  const payloadValue = (payload ||
    ({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: target,
      subject
    } as Record<string, unknown>)) as Prisma.InputJsonValue;

  await prisma.notificationLog.create({
    data: {
      appointmentId,
      channel,
      status,
      target,
      payload: payloadValue,
      sentAt: status === "SENT" ? new Date() : null,
      error: error || null
    }
  });
}

function getSignatureHtml() {
  return `
    <div style="margin-top:32px; border-top:1px solid #e2e8f0; padding-top:24px; text-align:left;">
      <img
        src="cid:email-signature"
        alt="Firma digital Soluciones Informaticas"
        style="width:320px; max-width:100%; height:auto; display:block;"
      />
    </div>
  `;
}

function buildEmailTemplate(template: AppointmentEmailTemplate, appointment: Appointment): MailContent {
  if (template === "APPOINTMENT_CONFIRMED") {
    return {
      subject: `Cita confirmada - ${appointment.serviceName}`,
      text: [
        `Hola ${appointment.fullName},`,
        "",
        "Tu cita ya fue confirmada por nuestro equipo.",
        `Servicio: ${appointment.serviceName}`,
        `Fecha: ${formatAppointmentDate(appointment.date)}`,
        "Estado: Confirmada",
        "",
        "Si necesitas actualizar algun detalle antes de la cita, puedes responder a este correo y con gusto te ayudaremos.",
        "",
        "Gracias por confiar en Soluciones Informaticas."
      ].join("\n"),
      html: `
        <div style="margin:0; padding:32px 16px; background:#eef4fb; font-family:Arial, sans-serif; color:#0f172a;">
          <div style="max-width:680px; margin:0 auto; overflow:hidden; border-radius:28px; background:#ffffff; box-shadow:0 24px 80px rgba(15,23,42,0.12);">
            <div style="padding:32px 36px; background:#10284d; color:#ffffff;">
              <p style="margin:0; font-size:12px; letter-spacing:0.35em; text-transform:uppercase; color:#93c5fd;">Confirmada</p>
              <h1 style="margin:16px 0 0; font-size:32px; line-height:1.2; font-weight:700; color:#ffffff;">Tu cita fue confirmada</h1>
              <p style="margin:14px 0 0; max-width:520px; font-size:16px; line-height:1.7; color:#dbeafe;">
                Hola <strong style="color:#ffffff;">${appointment.fullName}</strong>, tu cita ya fue confirmada por nuestro equipo.
              </p>
            </div>
            <div style="padding:32px 36px;">
              <div style="border-radius:24px; background:#f8fbff; border:1px solid #dbe7f6; padding:24px;">
                <h2 style="margin:0 0 18px; font-size:20px; color:#10213f;">Detalle de tu cita</h2>
                <p style="margin:0 0 10px; font-size:15px; color:#334155;"><strong>Servicio:</strong> ${appointment.serviceName}</p>
                <p style="margin:0 0 10px; font-size:15px; color:#334155;"><strong>Fecha:</strong> ${formatAppointmentDate(appointment.date)}</p>
                <p style="margin:0; font-size:15px; color:#334155;"><strong>Estado actual:</strong> Confirmada</p>
              </div>
              <div style="margin-top:28px; font-size:16px; line-height:1.8; color:#334155;">
                <p style="margin:0;">Si necesitas actualizar algun detalle antes de la cita, puedes responder a este correo y con gusto te ayudaremos.</p>
              </div>
              ${getSignatureHtml()}
            </div>
          </div>
        </div>
      `
    };
  }

  if (template === "APPOINTMENT_CANCELLED") {
    return {
      subject: `Cita cancelada - ${appointment.serviceName}`,
      text: [
        `Hola ${appointment.fullName},`,
        "",
        "Tu cita fue cancelada.",
        `Servicio: ${appointment.serviceName}`,
        `Fecha: ${formatAppointmentDate(appointment.date)}`,
        "Estado: Cancelada",
        "",
        "Si deseas reagendar una nueva fecha, puedes responder a este correo o escribirnos por WhatsApp y con gusto te ayudaremos.",
        "",
        "Gracias por confiar en Soluciones Informaticas."
      ].join("\n"),
      html: `
        <div style="margin:0; padding:32px 16px; background:#eef4fb; font-family:Arial, sans-serif; color:#0f172a;">
          <div style="max-width:680px; margin:0 auto; overflow:hidden; border-radius:28px; background:#ffffff; box-shadow:0 24px 80px rgba(15,23,42,0.12);">
            <div style="padding:32px 36px; background:#10284d; color:#ffffff;">
              <p style="margin:0; font-size:12px; letter-spacing:0.35em; text-transform:uppercase; color:#93c5fd;">Cancelada</p>
              <h1 style="margin:16px 0 0; font-size:32px; line-height:1.2; font-weight:700; color:#ffffff;">Tu cita fue cancelada</h1>
              <p style="margin:14px 0 0; max-width:520px; font-size:16px; line-height:1.7; color:#dbeafe;">
                Hola <strong style="color:#ffffff;">${appointment.fullName}</strong>, tu cita fue cancelada.
              </p>
            </div>
            <div style="padding:32px 36px;">
              <div style="border-radius:24px; background:#f8fbff; border:1px solid #dbe7f6; padding:24px;">
                <h2 style="margin:0 0 18px; font-size:20px; color:#10213f;">Detalle de tu cita</h2>
                <p style="margin:0 0 10px; font-size:15px; color:#334155;"><strong>Servicio:</strong> ${appointment.serviceName}</p>
                <p style="margin:0 0 10px; font-size:15px; color:#334155;"><strong>Fecha:</strong> ${formatAppointmentDate(appointment.date)}</p>
                <p style="margin:0; font-size:15px; color:#334155;"><strong>Estado actual:</strong> Cancelada</p>
              </div>
              <div style="margin-top:28px; font-size:16px; line-height:1.8; color:#334155;">
                <p style="margin:0;">Si deseas reagendar una nueva fecha, puedes responder a este correo o escribirnos por WhatsApp y con gusto te ayudaremos.</p>
              </div>
              ${getSignatureHtml()}
            </div>
          </div>
        </div>
      `
    };
  }

  return {
    subject: `Solicitud recibida - ${appointment.serviceName}`,
    text: [
      `Hola ${appointment.fullName},`,
      "",
      "Recibimos tu solicitud de cita en Soluciones Informaticas.",
      `Servicio: ${appointment.serviceName}`,
      `Fecha solicitada: ${formatAppointmentDate(appointment.date)}`,
      "",
      "Tu solicitud quedo registrada como pendiente de confirmacion.",
      "Nuestro equipo revisara tu solicitud y se comunicara contigo por correo electronico o WhatsApp lo antes posible para confirmar tu cita.",
      "",
      "Si necesitas ampliar informacion antes de la confirmacion, puedes responder a este correo y con gusto te ayudaremos.",
      "",
      "Gracias por confiar en Soluciones Informaticas."
    ].join("\n"),
    html: `
      <div style="margin:0; padding:32px 16px; background:#eef4fb; font-family:Arial, sans-serif; color:#0f172a;">
        <div style="max-width:680px; margin:0 auto; overflow:hidden; border-radius:28px; background:#ffffff; box-shadow:0 24px 80px rgba(15,23,42,0.12);">
          <div style="padding:32px 36px; background:#10284d; color:#ffffff;">
            <p style="margin:0; font-size:12px; letter-spacing:0.35em; text-transform:uppercase; color:#93c5fd;">Solicitud recibida</p>
            <h1 style="margin:16px 0 0; font-size:32px; line-height:1.2; font-weight:700; color:#ffffff;">Tu cita fue registrada correctamente</h1>
            <p style="margin:14px 0 0; max-width:520px; font-size:16px; line-height:1.7; color:#dbeafe;">
              Hola <strong style="color:#ffffff;">${appointment.fullName}</strong>, recibimos tu solicitud y ya se encuentra en revision para confirmacion.
            </p>
          </div>
          <div style="padding:32px 36px;">
            <div style="border-radius:24px; background:#f8fbff; border:1px solid #dbe7f6; padding:24px;">
              <h2 style="margin:0 0 18px; font-size:20px; color:#10213f;">Resumen de tu solicitud</h2>
              <p style="margin:0 0 10px; font-size:15px; color:#334155;"><strong>Servicio:</strong> ${appointment.serviceName}</p>
              <p style="margin:0 0 10px; font-size:15px; color:#334155;"><strong>Fecha solicitada:</strong> ${formatAppointmentDate(appointment.date)}</p>
              <p style="margin:0; font-size:15px; color:#334155;"><strong>Estado actual:</strong> Pendiente de confirmacion</p>
            </div>
            <div style="margin-top:28px; font-size:16px; line-height:1.8; color:#334155;">
              <p style="margin:0 0 14px;">
                Nuestro equipo revisara tu solicitud y se comunicara contigo por correo electronico o WhatsApp lo antes posible para confirmar tu cita.
              </p>
              <p style="margin:0;">
                Si necesitas ampliar informacion antes de la confirmacion, puedes responder a este correo y con gusto te ayudaremos.
              </p>
            </div>
            ${getSignatureHtml()}
          </div>
        </div>
      </div>
    `
  };
}

async function sendEmailNotification(appointment: Appointment, template: AppointmentEmailTemplate) {
  const mailer = getMailerConfig();
  const mail = buildEmailTemplate(template, appointment);

  if (!mailer) {
    await logNotification(
      appointment.id,
      "EMAIL",
      appointment.email,
      mail.subject,
      "SKIPPED",
      { template, to: appointment.email },
      "SMTP no configurado"
    );
    return;
  }

  try {
    await mailer.transporter.sendMail({
      from: mailer.from,
      to: appointment.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      attachments: [
        {
          filename: "email-signature.png",
          path: path.join(process.cwd(), "public", "email-signature.png"),
          cid: "email-signature"
        }
      ]
    });

    await logNotification(
      appointment.id,
      "EMAIL",
      appointment.email,
      mail.subject,
      "SENT",
      { template, to: appointment.email }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    await logNotification(
      appointment.id,
      "EMAIL",
      appointment.email,
      mail.subject,
      "FAILED",
      { template, to: appointment.email },
      message
    );
    throw error;
  }
}

async function sendWhatsAppNotification(appointment: Appointment) {
  const whatsappPayload = {
    to: appointment.phone,
    template: process.env.WHATSAPP_TEMPLATE_NAME,
    variables: {
      nombre: appointment.fullName,
      servicio: appointment.serviceName,
      fecha: appointment.date.toISOString()
    }
  };

  if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_TOKEN) {
    await logNotification(
      appointment.id,
      "WHATSAPP",
      appointment.phone,
      "Confirmacion por WhatsApp",
      "SKIPPED",
      whatsappPayload,
      "Integracion de WhatsApp no configurada"
    );
    return;
  }

  try {
    const response = await fetch(process.env.WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`
      },
      body: JSON.stringify(whatsappPayload)
    });

    if (!response.ok) {
      throw new Error(`WhatsApp respondio con estado ${response.status}`);
    }

    await logNotification(
      appointment.id,
      "WHATSAPP",
      appointment.phone,
      "Confirmacion por WhatsApp",
      "SENT",
      whatsappPayload
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    await logNotification(
      appointment.id,
      "WHATSAPP",
      appointment.phone,
      "Confirmacion por WhatsApp",
      "FAILED",
      whatsappPayload,
      message
    );
    throw error;
  }
}

function getRetryDelay(attempt: number) {
  const multiplier = Math.min(Math.max(attempt, 1), 5);
  return BASE_RETRY_DELAY_MS * multiplier;
}

function getProcessorUrl() {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
  return null;
}

async function insertNotificationJob(
  appointment: Appointment,
  channel: NotificationChannel,
  template: NotificationJobTemplate,
  target: string
) {
  await ensureNotificationInfrastructure();

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "NotificationJob" ("id", "appointmentId", "channel", "template", "target", "status", "attempts", "maxAttempts", "runAt", "createdAt", "updatedAt")
      VALUES ($1, $2, $3::"NotificationChannel", $4, $5, 'PENDING'::"NotificationJobStatus", 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
    randomUUID(),
    appointment.id,
    channel,
    template,
    target
  );
}

export async function enqueueAppointmentNotifications(appointment: Appointment) {
  await insertNotificationJob(appointment, "EMAIL", "APPOINTMENT_RECEIVED", appointment.email);
  await insertNotificationJob(appointment, "WHATSAPP", "WHATSAPP_APPOINTMENT_RECEIVED", appointment.phone);
}

export async function enqueueAppointmentStatusNotification(
  appointment: Appointment,
  status: "CONFIRMED" | "CANCELLED"
) {
  await insertNotificationJob(
    appointment,
    "EMAIL",
    status === "CONFIRMED" ? "APPOINTMENT_CONFIRMED" : "APPOINTMENT_CANCELLED",
    appointment.email
  );
}

export async function triggerNotificationProcessor() {
  const baseUrl = getProcessorUrl();
  const secret = process.env.NOTIFICATION_PROCESSOR_SECRET;

  if (!baseUrl || !secret) {
    return;
  }

  try {
    await fetch(`${baseUrl}/api/notifications/process`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`
      },
      cache: "no-store"
    });
  } catch (error) {
    console.error("No se pudo activar el procesador de notificaciones.", error);
  }
}

async function releaseStaleJobs() {
  await ensureNotificationInfrastructure();

  const staleThreshold = new Date(Date.now() - STALE_JOB_WINDOW_MS);

  await prisma.$executeRawUnsafe(
    `
      UPDATE "NotificationJob"
      SET "status" = 'FAILED'::"NotificationJobStatus",
          "lockedAt" = NULL,
          "lastError" = $1,
          "runAt" = CURRENT_TIMESTAMP,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "status" = 'PROCESSING'::"NotificationJobStatus"
        AND "lockedAt" < $2
    `,
    "El procesamiento anterior expiro y sera reintentado.",
    staleThreshold
  );
}

async function claimNextNotificationJob() {
  await releaseStaleJobs();

  const rows = await prisma.$queryRawUnsafe<NotificationJobRecord[]>(`
    WITH next_job AS (
      SELECT "id"
      FROM "NotificationJob"
      WHERE "status" IN ('PENDING'::"NotificationJobStatus", 'FAILED'::"NotificationJobStatus")
        AND "runAt" <= CURRENT_TIMESTAMP
        AND "attempts" < "maxAttempts"
      ORDER BY "runAt" ASC, "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE "NotificationJob" AS job
    SET "status" = 'PROCESSING'::"NotificationJobStatus",
        "lockedAt" = CURRENT_TIMESTAMP,
        "attempts" = job."attempts" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
    FROM next_job
    WHERE job."id" = next_job."id"
    RETURNING
      job."id",
      job."appointmentId",
      job."channel",
      job."template",
      job."target",
      job."status",
      job."attempts",
      job."maxAttempts",
      job."runAt",
      job."lockedAt"
  `);

  return rows[0] || null;
}

async function markJobCompleted(jobId: string) {
  await prisma.$executeRawUnsafe(
    `
      UPDATE "NotificationJob"
      SET "status" = 'COMPLETED'::"NotificationJobStatus",
          "processedAt" = CURRENT_TIMESTAMP,
          "lockedAt" = NULL,
          "lastError" = NULL,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1
    `,
    jobId
  );
}

async function markJobFailed(job: NotificationJobRecord, error: string) {
  const nextRunAt = new Date(Date.now() + getRetryDelay(job.attempts));

  await prisma.$executeRawUnsafe(
    `
      UPDATE "NotificationJob"
      SET "status" = 'FAILED'::"NotificationJobStatus",
          "runAt" = $2,
          "lockedAt" = NULL,
          "lastError" = $3,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1
    `,
    job.id,
    nextRunAt,
    error
  );
}

async function processNotificationJob(job: NotificationJobRecord) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: job.appointmentId }
  });

  if (!appointment) {
    await markJobFailed(job, "La cita relacionada ya no existe.");
    return { jobId: job.id, status: "FAILED" as const };
  }

  try {
    if (job.channel === "EMAIL") {
      await sendEmailNotification(appointment, job.template as AppointmentEmailTemplate);
    } else {
      await sendWhatsAppNotification(appointment);
    }

    await markJobCompleted(job.id);
    return { jobId: job.id, status: "COMPLETED" as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    await markJobFailed(job, message);
    return { jobId: job.id, status: "FAILED" as const };
  }
}

export async function processPendingNotificationJobs(limit = 10) {
  const results: Array<{ jobId: string; status: "COMPLETED" | "FAILED" }> = [];

  for (let index = 0; index < limit; index += 1) {
    const job = await claimNextNotificationJob();

    if (!job) {
      break;
    }

    const result = await processNotificationJob(job);
    results.push(result);
  }

  return {
    processed: results.length,
    completed: results.filter((item) => item.status === "COMPLETED").length,
    failed: results.filter((item) => item.status === "FAILED").length
  };
}
