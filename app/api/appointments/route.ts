import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enqueueAppointmentNotifications, triggerNotificationProcessor } from "@/lib/notifications";
import { defaultServices } from "@/lib/site";
import { createLocalDateTime, isSlotWithinBusinessHours } from "@/lib/availability";
import { appointmentSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = appointmentSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Datos invalidos." },
        { status: 400 }
      );
    }

    let service = await prisma.service.findUnique({
      where: { id: parsed.data.serviceId }
    });

    if (!service) {
      service = await prisma.service.findUnique({
        where: { slug: parsed.data.serviceId }
      });
    }

    if (!service) {
      const fallbackService = defaultServices.find((item) => item.slug === parsed.data.serviceId);

      if (fallbackService) {
        service = await prisma.service.create({
          data: {
            name: fallbackService.name,
            slug: fallbackService.slug,
            shortDescription: fallbackService.shortDescription,
            description: fallbackService.description
          }
        });
      }
    }

    if (!service || !service.isActive) {
      return NextResponse.json({ error: "El servicio seleccionado no esta disponible." }, { status: 400 });
    }

    const [appointmentDate, appointmentTime] = parsed.data.date.split("T");

    if (!appointmentDate || !appointmentTime || !isSlotWithinBusinessHours(appointmentDate, appointmentTime)) {
      return NextResponse.json({ error: "Selecciona un horario disponible dentro de la jornada de atencion." }, { status: 400 });
    }

    const appointmentDateTime = createLocalDateTime(appointmentDate, appointmentTime);

    if (appointmentDateTime.getTime() <= Date.now()) {
      return NextResponse.json({ error: "La cita debe ser en una fecha futura." }, { status: 400 });
    }

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        date: appointmentDateTime,
        status: {
          in: ["PENDING", "CONFIRMED"]
        }
      },
      select: {
        id: true
      }
    });

    if (existingAppointment) {
      return NextResponse.json({ error: "La hora seleccionada ya no esta disponible." }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        email: parsed.data.email,
        serviceId: service.id,
        serviceName: service.name,
        date: appointmentDateTime,
        notes: parsed.data.notes || null,
        status: "PENDING"
      }
    });

    void enqueueAppointmentNotifications(appointment)
      .then(() => triggerNotificationProcessor())
      .catch((notificationError) => {
        console.error("No se pudieron preparar las notificaciones de la cita.", notificationError);
      });

    return NextResponse.json(
      {
        ok: true,
        appointmentId: appointment.id,
        status: appointment.status
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "La hora seleccionada ya no esta disponible." }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "No se pudo registrar la cita." }, { status: 500 });
  }
}
