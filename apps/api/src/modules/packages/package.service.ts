import type { PackageInput, PackageListQuery, Paginated } from "@clickviajes/shared";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { currentTenantId } from "../../lib/tenant-context.js";
import { AppError } from "../../utils/app-error.js";

const include = {
  destinations: { include: { destination: { select: { id: true, name: true, country: true } } } },
  itinerary: { orderBy: { dayNumber: "asc" } },
} satisfies Prisma.PackageInclude;

/** Verifica que todos los destinos pertenezcan al tenant actual. */
async function assertDestinationsOwned(ids: string[]) {
  if (ids.length === 0) return;
  const count = await prisma.destination.count({ where: { id: { in: ids } } });
  if (count !== new Set(ids).size) throw AppError.badRequest("Algún destino no pertenece a la agencia");
}

export async function listPackages(query: PackageListQuery): Promise<Paginated<unknown>> {
  const { search, page, pageSize } = query;
  const where: Prisma.PackageWhereInput = search ? { name: { contains: search, mode: "insensitive" } } : {};
  const [items, total] = await Promise.all([
    prisma.package.findMany({ where, include, orderBy: { name: "asc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.package.count({ where }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 };
}

export async function getPackage(id: string) {
  const pkg = await prisma.package.findFirst({ where: { id }, include });
  if (!pkg) throw AppError.notFound("Paquete no encontrado");
  return pkg;
}

export async function createPackage(input: PackageInput) {
  const tenantId = currentTenantId();
  if (!tenantId) throw AppError.unauthorized("Sin agencia en contexto");
  await assertDestinationsOwned(input.destinationIds);

  return prisma.package.create({
    data: {
      tenantId,
      name: input.name,
      description: input.description?.trim() || null,
      basePrice: input.basePrice ?? null,
      currency: input.currency,
      destinations: { create: input.destinationIds.map((destinationId) => ({ destinationId })) },
      itinerary: {
        create: input.itinerary.map((i) => ({
          dayNumber: i.dayNumber,
          title: i.title,
          description: i.description?.trim() || null,
        })),
      },
    },
    include,
  });
}

export async function updatePackage(id: string, input: PackageInput) {
  await getPackage(id);
  await assertDestinationsOwned(input.destinationIds);

  return prisma.$transaction(async (tx) => {
    await tx.packageDestination.deleteMany({ where: { packageId: id } });
    await tx.packageItineraryItem.deleteMany({ where: { packageId: id } });
    return tx.package.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description?.trim() || null,
        basePrice: input.basePrice ?? null,
        currency: input.currency,
        destinations: { create: input.destinationIds.map((destinationId) => ({ destinationId })) },
        itinerary: {
          create: input.itinerary.map((i) => ({
            dayNumber: i.dayNumber,
            title: i.title,
            description: i.description?.trim() || null,
          })),
        },
      },
      include,
    });
  });
}

export async function deletePackage(id: string) {
  await getPackage(id);
  await prisma.package.delete({ where: { id } });
}
