import type { BookingInput, BookingListQuery, Paginated } from "@clickviajes/shared";
import { Prisma, type BookingStatus } from "@prisma/client";
import { prisma, prismaBase } from "../../lib/prisma.js";
import { currentTenantId, getTenantContext } from "../../lib/tenant-context.js";
import { recordAudit } from "../../lib/audit.js";
import { AppError } from "../../utils/app-error.js";

const include = {
  customer: { select: { id: true, firstName: true, lastName: true } },
  trip: { select: { id: true, name: true, capacity: true, bookedSeats: true, startDate: true, endDate: true } },
  seller: { select: { id: true, fullName: true } },
  passengers: true,
  quote: { select: { id: true } },
} satisfies Prisma.BookingInclude;

async function ctx() {
  const tenantId = currentTenantId();
  const sellerId = getTenantContext()?.userId;
  if (!tenantId || !sellerId) throw AppError.unauthorized("Sin contexto de agencia/usuario");
  return { tenantId, sellerId };
}

async function assertCustomerOwned(customerId: string) {
  if ((await prisma.customer.count({ where: { id: customerId } })) === 0) {
    throw AppError.badRequest("El cliente no pertenece a la agencia");
  }
}

function passengerCreate(input: BookingInput, tenantId: string) {
  return input.passengers.map((p) => ({
    tenantId,
    customerId: p.customerId || null,
    firstName: p.firstName,
    lastName: p.lastName,
    docType: p.docType ?? null,
    docNumber: p.docNumber?.trim() || null,
    birthDate: p.birthDate ?? null,
  }));
}

/** Resuelve la tasa de comisión (override del booking o la del vendedor). */
async function resolveCommission(sellerId: string, input: BookingInput) {
  let rate = input.commissionRate ?? null;
  if (rate === null) {
    const seller = await prismaBase.user.findUnique({ where: { id: sellerId } });
    rate = seller?.commissionRate ? Number(seller.commissionRate) : 0;
  }
  const amount = new Prisma.Decimal(input.totalAmount).mul(rate).div(100);
  return { rate, amount };
}

export async function listBookings(query: BookingListQuery): Promise<Paginated<unknown>> {
  const { search, status, tripId, page, pageSize, sortBy, sortDir } = query;
  const where: Prisma.BookingWhereInput = {
    ...(status ? { status } : {}),
    ...(tripId ? { tripId } : {}),
    ...(search
      ? {
          customer: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };
  const orderBy = { [sortBy]: sortDir } as Prisma.BookingOrderByWithRelationInput;
  const [items, total] = await Promise.all([
    prisma.booking.findMany({ where, include, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.booking.count({ where }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 };
}

export async function getBooking(id: string) {
  const booking = await prisma.booking.findFirst({ where: { id }, include });
  if (!booking) throw AppError.notFound("Reserva no encontrada");
  return booking;
}

export async function createBooking(input: BookingInput) {
  const { tenantId, sellerId } = await ctx();
  await assertCustomerOwned(input.customerId);
  const { rate, amount } = await resolveCommission(sellerId, input);

  const created = await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findFirst({
      where: { id: input.tripId, tenantId },
      select: { capacity: true, bookedSeats: true },
    });
    if (!trip) throw AppError.notFound("Viaje no encontrado");

    // Ocupa cupo de forma ATÓMICA: el UPDATE condicional (WHERE sobre
    // bookedSeats) se re-evalúa bajo el lock de fila, evitando sobreventa ante
    // reservas concurrentes.
    const occupied = await tx.trip.updateMany({
      where: { id: input.tripId, tenantId, bookedSeats: { lte: trip.capacity - input.paxCount } },
      data: { bookedSeats: { increment: input.paxCount } },
    });
    if (occupied.count === 0) {
      throw AppError.conflict(`No hay cupo suficiente (disponibles: ${trip.capacity - trip.bookedSeats})`);
    }

    // Si proviene de una cotización, validarla y marcarla como aceptada.
    if (input.quoteId) {
      const q = await tx.quote.findFirst({ where: { id: input.quoteId, tenantId } });
      if (!q) throw AppError.badRequest("La cotización no pertenece a la agencia");
      if (q.status === "REJECTED") throw AppError.conflict("La cotización fue rechazada");
      const vencida = q.status === "EXPIRED" || (q.validUntil != null && q.validUntil < new Date());
      if (vencida) throw AppError.conflict("La cotización está vencida; genera una nueva");
      await tx.quote.update({ where: { id: input.quoteId }, data: { status: "ACCEPTED" } });
    }

    return tx.booking.create({
      data: {
        tenantId,
        sellerId,
        customerId: input.customerId,
        tripId: input.tripId,
        quoteId: input.quoteId || null,
        status: "PENDING",
        paxCount: input.paxCount,
        totalAmount: input.totalAmount,
        currency: input.currency,
        commissionRate: rate,
        commissionAmount: amount,
        passengers: { create: passengerCreate(input, tenantId) },
      },
      include,
    });
  });
  await recordAudit("booking.create", "Booking", created.id, `Reserva creada · ${input.paxCount} pax · ${input.totalAmount} ${input.currency}`);
  return created;
}

export async function updateBooking(id: string, input: BookingInput) {
  const { tenantId, sellerId } = await ctx();
  await assertCustomerOwned(input.customerId);
  const { rate, amount } = await resolveCommission(sellerId, input);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.booking.findFirst({ where: { id, tenantId } });
    if (!existing) throw AppError.notFound("Reserva no encontrada");

    const occupies = existing.status !== "CANCELLED";
    // Libera el cupo del viaje anterior y reocupa en el (posible nuevo) viaje,
    // de forma atómica para evitar sobreventa.
    if (occupies) {
      await tx.trip.updateMany({ where: { id: existing.tripId, tenantId }, data: { bookedSeats: { decrement: existing.paxCount } } });
      const trip = await tx.trip.findFirst({
        where: { id: input.tripId, tenantId },
        select: { capacity: true, bookedSeats: true },
      });
      if (!trip) throw AppError.notFound("Viaje no encontrado");
      const occupied = await tx.trip.updateMany({
        where: { id: input.tripId, tenantId, bookedSeats: { lte: trip.capacity - input.paxCount } },
        data: { bookedSeats: { increment: input.paxCount } },
      });
      if (occupied.count === 0) {
        throw AppError.conflict(`No hay cupo suficiente (disponibles: ${trip.capacity - trip.bookedSeats})`);
      }
    }

    await tx.passenger.deleteMany({ where: { bookingId: id, tenantId } });
    return tx.booking.update({
      where: { id },
      data: {
        customerId: input.customerId,
        tripId: input.tripId,
        paxCount: input.paxCount,
        totalAmount: input.totalAmount,
        currency: input.currency,
        commissionRate: rate,
        commissionAmount: amount,
        passengers: { create: passengerCreate(input, tenantId) },
      },
      include,
    });
  });
}

export async function changeBookingStatus(id: string, status: BookingStatus) {
  const { tenantId } = await ctx();
  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.findFirst({ where: { id, tenantId } });
    if (!b) throw AppError.notFound("Reserva no encontrada");

    const oldOcc = b.status !== "CANCELLED" ? b.paxCount : 0;
    const newOcc = status !== "CANCELLED" ? b.paxCount : 0;
    const delta = newOcc - oldOcc;

    if (delta > 0) {
      const trip = await tx.trip.findFirst({
        where: { id: b.tripId, tenantId },
        select: { capacity: true, bookedSeats: true },
      });
      if (!trip) throw AppError.notFound("Viaje no encontrado");
      const occupied = await tx.trip.updateMany({
        where: { id: b.tripId, tenantId, bookedSeats: { lte: trip.capacity - delta } },
        data: { bookedSeats: { increment: delta } },
      });
      if (occupied.count === 0) throw AppError.conflict(`No hay cupo suficiente (disponibles: ${trip.capacity - trip.bookedSeats})`);
    } else if (delta < 0) {
      await tx.trip.updateMany({ where: { id: b.tripId, tenantId }, data: { bookedSeats: { decrement: -delta } } });
    }
    return tx.booking.update({ where: { id }, data: { status }, include });
  });
  await recordAudit("booking.status", "Booking", id, `Reserva → estado ${status}`);
  return updated;
}

export async function deleteBooking(id: string) {
  const { tenantId } = await ctx();
  // No se puede borrar una reserva con pagos: se perdería el historial financiero.
  const payCount = await prisma.payment.count({ where: { bookingId: id } });
  if (payCount > 0) {
    throw AppError.conflict("La reserva tiene pagos registrados; cancélala en lugar de eliminarla.");
  }
  await prisma.$transaction(async (tx) => {
    const b = await tx.booking.findFirst({ where: { id, tenantId } });
    if (!b) throw AppError.notFound("Reserva no encontrada");
    if (b.status !== "CANCELLED") {
      await tx.trip.updateMany({ where: { id: b.tripId, tenantId }, data: { bookedSeats: { decrement: b.paxCount } } });
    }
    await tx.booking.delete({ where: { id } });
  });
  await recordAudit("booking.delete", "Booking", id, "Reserva eliminada");
}
