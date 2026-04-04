import { z } from "zod";

export const appointmentSchema = z.object({
  fullName: z
    .string()
    .min(3, "Ingresa el nombre completo.")
    .regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/, "El nombre solo puede contener letras."),
  phone: z
    .string()
    .regex(/^\d{10}$/, "Ingresa un telefono valido de 10 digitos."),
  email: z.string().email("Ingresa un correo valido."),
  serviceId: z.string().min(3, "Selecciona un servicio."),
  date: z
    .string()
    .min(1, "Selecciona fecha y hora.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Ingresa una fecha valida.")
    .refine((value) => new Date(value).getTime() > Date.now(), "La cita debe ser en una fecha futura."),
  notes: z.string().max(500, "Maximo 500 caracteres.").optional().or(z.literal(""))
});

export const serviceSchema = z.object({
  name: z.string().min(3, "El nombre es obligatorio."),
  slug: z
    .string()
    .min(3, "El slug es obligatorio.")
    .regex(/^[a-z0-9-]+$/, "Usa solo minusculas, numeros y guiones."),
  shortDescription: z.string().max(180, "Maximo 180 caracteres.").optional().or(z.literal("")),
  description: z.string().max(800, "Maximo 800 caracteres.").optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(999)
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
