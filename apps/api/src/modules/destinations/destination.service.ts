import type { DestinationInput, DestinationListQuery, Paginated } from "@clickviajes/shared";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { currentTenantId } from "../../lib/tenant-context.js";
import { AppError } from "../../utils/app-error.js";

const withAttractions = { attractions: true } satisfies Prisma.DestinationInclude;

export async function listDestinations(query: DestinationListQuery): Promise<Paginated<unknown>> {
  const { search, page, pageSize } = query;

  const where: Prisma.DestinationWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { country: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.destination.findMany({
      where,
      include: withAttractions,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.destination.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 };
}

export async function getDestination(id: string) {
  const destination = await prisma.destination.findFirst({ where: { id }, include: withAttractions });
  if (!destination) throw AppError.notFound("Destino no encontrado");
  return destination;
}

export async function createDestination(input: DestinationInput) {
  const tenantId = currentTenantId();
  if (!tenantId) throw AppError.unauthorized("Sin agencia en contexto");

  return prisma.destination.create({
    data: {
      tenantId,
      name: input.name,
      country: input.country,
      city: input.city?.trim() || null,
      description: input.description?.trim() || null,
      recommendedSeason: input.recommendedSeason?.trim() || null,
      photos: input.photos,
      attractions: {
        create: input.attractions.map((a) => ({
          tenantId,
          name: a.name,
          description: a.description?.trim() || null,
        })),
      },
    },
    include: withAttractions,
  });
}

export async function updateDestination(id: string, input: DestinationInput) {
  const tenantId = currentTenantId();
  if (!tenantId) throw AppError.unauthorized("Sin agencia en contexto");

  await getDestination(id); // valida tenant + existencia

  return prisma.$transaction(async (tx) => {
    await tx.attraction.deleteMany({ where: { destinationId: id, tenantId } });
    return tx.destination.update({
      where: { id },
      data: {
        name: input.name,
        country: input.country,
        city: input.city?.trim() || null,
        description: input.description?.trim() || null,
        recommendedSeason: input.recommendedSeason?.trim() || null,
        photos: input.photos,
        attractions: {
          create: input.attractions.map((a) => ({
            tenantId,
            name: a.name,
            description: a.description?.trim() || null,
          })),
        },
      },
      include: withAttractions,
    });
  });
}

export async function deleteDestination(id: string) {
  await getDestination(id); // valida tenant + existencia
  const [inPackages, inTrips] = await Promise.all([
    prisma.packageDestination.count({ where: { destinationId: id } }),
    prisma.tripDestination.count({ where: { destinationId: id } }),
  ]);
  if (inPackages + inTrips > 0) {
    throw AppError.conflict("No se puede eliminar: el destino está usado en paquetes o viajes");
  }
  await prisma.destination.delete({ where: { id } });
}
