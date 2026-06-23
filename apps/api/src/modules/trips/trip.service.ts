import type { TripInput, TripListQuery, TripMargin, Paginated, Currency } from "@clickviajes/shared";
import { Prisma } from "@prisma/client";
import { prisma, prismaBase } from "../../lib/prisma.js";
import { currentTenantId } from "../../lib/tenant-context.js";
import { convert } from "../../lib/currency.js";
import { AppError } from "../../utils/app-error.js";

const include = {
  destinations: { include: { destination: { select: { id: true, name: true, country: true } } } },
  itinerary: { orderBy: { dayNumber: "asc" } },
  suppliers: { include: { supplier: { select: { id: true, name: true, type: true } } } },
  package: { select: { id: true, name: true } },
} satisfies Prisma.TripInclude;

type TripWithRelations = Prisma.TripGetPayload<{ include: typeof include }>;

async function getBaseCurrency(tenantId: string): Promise<Currency> {
  const tenant = await prismaBase.tenant.findUnique({ where: { id: tenantId } });
  return (tenant?.baseCurrency ?? "PYG") as Currency;
}

async function assertOwned(model: "destination" | "supplier", ids: string[]) {
  if (ids.length === 0) return;
  const unique = [...new Set(ids)];
  const count =
    model === "destination"
      ? await prisma.destination.count({ where: { id: { in: unique } } })
      : await prisma.supplier.count({ where: { id: { in: unique } } });
  if (count !== unique.length) {
    throw AppError.badRequest(`Algún ${model === "destination" ? "destino" : "proveedor"} no pertenece a la agencia`);
  }
}

/** Calcula el margen del viaje convertido a la moneda base del tenant. */
async function computeMargin(trip: TripWithRelations, baseCurrency: Currency): Promise<TripMargin> {
  let incomplete = false;

  const saleBase = await convert(trip.salePrice, trip.saleCurrency as Currency, baseCurrency);
  if (saleBase === null) incomplete = true;

  let totalCost = new Prisma.Decimal(0);
  for (const ts of trip.suppliers) {
    const c = await convert(ts.cost, ts.costCurrency as Currency, baseCurrency);
    if (c === null) incomplete = true;
    else totalCost = totalCost.plus(c);
  }

  const salePriceBase = saleBase ? saleBase.toNumber() : null;
  const totalCostBase = totalCost.toNumber();
  const margin = salePriceBase !== null ? salePriceBase - totalCostBase : null;
  const marginPct = margin !== null && salePriceBase ? (margin / salePriceBase) * 100 : null;

  return { baseCurrency, salePriceBase, totalCostBase, margin, marginPct, incomplete };
}

function serialize(trip: TripWithRelations, margin: TripMargin) {
  return { ...trip, availableSeats: trip.capacity - trip.bookedSeats, margin };
}

export async function listTrips(query: TripListQuery): Promise<Paginated<unknown>> {
  const tenantId = currentTenantId();
  if (!tenantId) throw AppError.unauthorized("Sin agencia en contexto");
  const baseCurrency = await getBaseCurrency(tenantId);

  const { search, status, page, pageSize } = query;
  const where: Prisma.TripWhereInput = {
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    ...(status ? { status } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.trip.findMany({ where, include, orderBy: { startDate: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.trip.count({ where }),
  ]);

  const items = await Promise.all(rows.map(async (t) => serialize(t, await computeMargin(t, baseCurrency))));
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 };
}

export async function getTrip(id: string) {
  const tenantId = currentTenantId();
  if (!tenantId) throw AppError.unauthorized("Sin agencia en contexto");
  const trip = await prisma.trip.findFirst({ where: { id }, include });
  if (!trip) throw AppError.notFound("Viaje no encontrado");
  const baseCurrency = await getBaseCurrency(tenantId);
  return serialize(trip, await computeMargin(trip, baseCurrency));
}

function nestedWrites(input: TripInput, tenantId: string) {
  return {
    destinations: { create: input.destinationIds.map((destinationId) => ({ destinationId })) },
    itinerary: {
      create: input.itinerary.map((i) => ({
        dayNumber: i.dayNumber,
        date: i.date ?? null,
        title: i.title,
        description: i.description?.trim() || null,
      })),
    },
    suppliers: {
      create: input.suppliers.map((s) => ({
        tenantId,
        supplierId: s.supplierId,
        description: s.description?.trim() || null,
        cost: s.cost,
        costCurrency: s.costCurrency,
      })),
    },
  };
}

export async function createTrip(input: TripInput) {
  const tenantId = currentTenantId();
  if (!tenantId) throw AppError.unauthorized("Sin agencia en contexto");
  await assertOwned("destination", input.destinationIds);
  await assertOwned("supplier", input.suppliers.map((s) => s.supplierId));

  const created = await prisma.trip.create({
    data: {
      tenantId,
      name: input.name,
      packageId: input.packageId || null,
      startDate: input.startDate,
      endDate: input.endDate,
      capacity: input.capacity,
      status: input.status,
      salePrice: input.salePrice,
      saleCurrency: input.saleCurrency,
      ...nestedWrites(input, tenantId),
    },
    include,
  });
  return serialize(created, await computeMargin(created, await getBaseCurrency(tenantId)));
}

export async function updateTrip(id: string, input: TripInput) {
  const tenantId = currentTenantId();
  if (!tenantId) throw AppError.unauthorized("Sin agencia en contexto");
  const existing = await prisma.trip.findFirst({ where: { id } });
  if (!existing) throw AppError.notFound("Viaje no encontrado");
  await assertOwned("destination", input.destinationIds);
  await assertOwned("supplier", input.suppliers.map((s) => s.supplierId));

  // No permitir capacidad menor a los cupos ya reservados.
  if (input.capacity < existing.bookedSeats) {
    throw AppError.badRequest(`El cupo no puede ser menor a las plazas ya reservadas (${existing.bookedSeats})`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.tripDestination.deleteMany({ where: { tripId: id } });
    await tx.tripItineraryItem.deleteMany({ where: { tripId: id } });
    await tx.tripSupplier.deleteMany({ where: { tripId: id, tenantId } });
    return tx.trip.update({
      where: { id },
      data: {
        name: input.name,
        packageId: input.packageId || null,
        startDate: input.startDate,
        endDate: input.endDate,
        capacity: input.capacity,
        status: input.status,
        salePrice: input.salePrice,
        saleCurrency: input.saleCurrency,
        ...nestedWrites(input, tenantId),
      },
      include,
    });
  });
  return serialize(updated, await computeMargin(updated, await getBaseCurrency(tenantId)));
}

export async function deleteTrip(id: string) {
  const trip = await prisma.trip.findFirst({ where: { id } });
  if (!trip) throw AppError.notFound("Viaje no encontrado");
  await prisma.trip.delete({ where: { id } });
}
