const WEEKDAY_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"] as const;
const SATURDAY_SLOTS = ["09:00", "10:00", "11:00", "12:00"] as const;

function getLocalDateFromISO(dateISO: string) {
  const [year, month, day] = dateISO.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function createLocalDateTime(dateISO: string, time: string) {
  const [year, month, day] = dateISO.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function getDayTimeSlots(dateISO: string) {
  const date = getLocalDateFromISO(dateISO);
  const dayOfWeek = date.getDay();

  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    return [...WEEKDAY_SLOTS];
  }

  if (dayOfWeek === 6) {
    return [...SATURDAY_SLOTS];
  }

  return [];
}

export function isSlotWithinBusinessHours(dateISO: string, time: string) {
  return getDayTimeSlots(dateISO).includes(time as (typeof WEEKDAY_SLOTS)[number]);
}

export function getDayBounds(dateISO: string) {
  const start = createLocalDateTime(dateISO, "00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export function getAvailableTimeSlots(dateISO: string, reservedDates: Date[], now = new Date()) {
  const allSlots = getDayTimeSlots(dateISO);

  if (allSlots.length === 0) {
    return [];
  }

  const reservedTimes = new Set(
    reservedDates.map((date) => `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`)
  );

  return allSlots.filter((time) => {
    const slotDate = createLocalDateTime(dateISO, time);
    return slotDate.getTime() > now.getTime() && !reservedTimes.has(time);
  });
}

export function getAvailabilityMessage(dateISO: string, availableTimes: string[]) {
  const allSlots = getDayTimeSlots(dateISO);
  const date = getLocalDateFromISO(dateISO);
  const dayOfWeek = date.getDay();

  if (allSlots.length === 0) {
    return "Los domingos no tenemos atencion. Elige otra fecha y con gusto te ayudamos.";
  }

  if (availableTimes.length === 0) {
    return dayOfWeek === 6
      ? "El sabado seleccionado ya no tiene horarios libres. Prueba con otro dia."
      : "Por ahora no quedan horas disponibles en esa fecha. Puedes elegir otro dia.";
  }

  return dayOfWeek === 6
    ? "Horario del sabado: atencion de 09:00 a 13:00, una cita por hora."
    : "Horario disponible: de 08:00 a 13:00 y de 14:00 a 18:00, una cita por hora.";
}
