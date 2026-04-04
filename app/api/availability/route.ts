import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableTimeSlots, getAvailabilityMessage, getDayBounds } from "@/lib/availability";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "La fecha es obligatoria." }, { status: 400 });
  }

  try {
    const { start, end } = getDayBounds(date);
    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: start,
          lt: end
        },
        status: {
          in: ["PENDING", "CONFIRMED"]
        }
      },
      select: {
        date: true
      },
      orderBy: {
        date: "asc"
      }
    });

    const availableTimes = getAvailableTimeSlots(
      date,
      appointments.map((appointment) => appointment.date)
    );

    return NextResponse.json({
      availableTimes,
      message: getAvailabilityMessage(date, availableTimes)
    });
  } catch (error) {
    console.error("No se pudo consultar la disponibilidad", error);
    return NextResponse.json({ error: "No se pudo consultar la disponibilidad." }, { status: 500 });
  }
}
