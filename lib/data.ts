import { prisma } from "@/lib/prisma";
import { defaultServices } from "@/lib/site";
import type { Prisma } from "@prisma/client";

type FallbackService = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
};

function getFallbackServices(): FallbackService[] {
  return defaultServices.map((service, index) => ({
    id: service.slug,
    name: service.name,
    slug: service.slug,
    shortDescription: service.shortDescription,
    description: service.description,
    isActive: true,
    sortOrder: index
  }));
}

async function ensureDefaultServices() {
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
          sortOrder: index,
          isActive: true
        }
      })
    )
  );
}

export async function getActiveServices() {
  try {
    await ensureDefaultServices();

    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });

    if (services.length > 0) {
      return services;
    }
  } catch (error) {
    console.error("No se pudieron obtener los servicios activos", error);
  }

  return getFallbackServices();
}

export async function getAdminDashboardData() {
  try {
    const [appointmentsCount, pendingCount, confirmedCount, cancelledCount, servicesCount, recentAppointments] =
      await Promise.all([
        prisma.appointment.count(),
        prisma.appointment.count({ where: { status: "PENDING" } }),
        prisma.appointment.count({ where: { status: "CONFIRMED" } }),
        prisma.appointment.count({ where: { status: "CANCELLED" } }),
        prisma.service.count(),
        prisma.appointment.findMany({
          include: { service: true },
          orderBy: { createdAt: "desc" },
          take: 10
        })
      ]);

    return {
      appointmentsCount,
      pendingCount,
      confirmedCount,
      cancelledCount,
      servicesCount,
      recentAppointments
    };
  } catch (error) {
    console.error("No se pudo cargar el dashboard administrativo", error);

    return {
      appointmentsCount: 0,
      pendingCount: 0,
      confirmedCount: 0,
      cancelledCount: 0,
      servicesCount: 0,
      recentAppointments: []
    };
  }
}

type AdminAppointmentsFilters = {
  from?: string;
  to?: string;
  limit?: number;
};

function createDateRangeFilters(filters: AdminAppointmentsFilters): Prisma.AppointmentWhereInput {
  const where: Prisma.AppointmentWhereInput = {};
  const dateFilter: Prisma.DateTimeFilter = {};

  if (filters.from) {
    const [year, month, day] = filters.from.split("-").map(Number);
    dateFilter.gte = new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  if (filters.to) {
    const [year, month, day] = filters.to.split("-").map(Number);
    dateFilter.lte = new Date(year, month - 1, day, 23, 59, 59, 999);
  }

  if (filters.from || filters.to) {
    where.date = dateFilter;
  }

  return where;
}

export async function getAdminAppointments(filters: AdminAppointmentsFilters = {}) {
  try {
    return await prisma.appointment.findMany({
      where: createDateRangeFilters(filters),
      include: { service: true, notifications: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: filters.limit
    });
  } catch (error) {
    console.error("No se pudieron obtener las citas administrativas", error);
    return [];
  }
}

export async function getAdminServices() {
  try {
    await ensureDefaultServices();

    return await prisma.service.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });
  } catch (error) {
    console.error("No se pudieron obtener los servicios administrativos", error);
    return [];
  }
}
