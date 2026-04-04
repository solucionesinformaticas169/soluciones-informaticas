"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAdminSession, requireAdminSession } from "@/lib/auth";
import { enqueueAppointmentStatusNotification, triggerNotificationProcessor } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { defaultServices } from "@/lib/site";
import { serviceSchema } from "@/lib/validators";

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function updateAppointmentStatusAction(formData: FormData) {
  await requireAdminSession();

  const appointmentId = String(formData.get("appointmentId") || "");
  const status = String(formData.get("status") || "");

  if (!appointmentId || !["PENDING", "CONFIRMED", "CANCELLED"].includes(status)) {
    return;
  }

  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: status as "PENDING" | "CONFIRMED" | "CANCELLED" }
  });

  if (status === "CONFIRMED" || status === "CANCELLED") {
    await enqueueAppointmentStatusNotification(appointment, status);
    void triggerNotificationProcessor();
  }

  revalidatePath("/admin");
  revalidatePath("/admin/appointments");
}

export async function createServiceAction(formData: FormData) {
  await requireAdminSession();

  const parsed = serviceSchema.safeParse({
    name: String(formData.get("name") || ""),
    slug: String(formData.get("slug") || ""),
    shortDescription: String(formData.get("shortDescription") || ""),
    description: String(formData.get("description") || ""),
    sortOrder: String(formData.get("sortOrder") || "0")
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "No se pudo crear el servicio.");
  }

  await prisma.service.upsert({
    where: { slug: parsed.data.slug },
    update: {
      name: parsed.data.name,
      shortDescription: parsed.data.shortDescription || null,
      description: parsed.data.description || null,
      sortOrder: parsed.data.sortOrder,
      isActive: true
    },
    create: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      shortDescription: parsed.data.shortDescription || null,
      description: parsed.data.description || null,
      sortOrder: parsed.data.sortOrder,
      isActive: true
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/services");
  revalidatePath("/agendar");
}

export async function toggleServiceStatusAction(formData: FormData) {
  await requireAdminSession();

  const serviceId = String(formData.get("serviceId") || "");
  const isActive = String(formData.get("isActive") || "") === "true";

  if (!serviceId) {
    return;
  }

  await prisma.service.update({
    where: { id: serviceId },
    data: { isActive: !isActive }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/services");
  revalidatePath("/agendar");
}

export async function seedDefaultServicesAction() {
  await requireAdminSession();

  await Promise.all(
    defaultServices.map((service, index) =>
      prisma.service.upsert({
        where: { slug: service.slug },
        update: {
          name: service.name,
          shortDescription: service.shortDescription,
          description: service.description,
          sortOrder: index
        },
        create: {
          name: service.name,
          slug: service.slug,
          shortDescription: service.shortDescription,
          description: service.description,
          sortOrder: index
        }
      })
    )
  );

  revalidatePath("/admin");
  revalidatePath("/admin/services");
  revalidatePath("/agendar");
}
