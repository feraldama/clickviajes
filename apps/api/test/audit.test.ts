import { beforeEach, describe, expect, it } from "vitest";
import type { BookingInput, CustomerInput, TripInput } from "@clickviajes/shared";
import { ctx, makeTenant, resetDb } from "./helpers.js";
import { prismaBase } from "../src/lib/prisma.js";
import * as customers from "../src/modules/customers/customer.service.js";
import * as trips from "../src/modules/trips/trip.service.js";
import * as bookings from "../src/modules/bookings/booking.service.js";
import * as payments from "../src/modules/payments/payment.service.js";

beforeEach(resetDb);

const customerInput: CustomerInput = {
  personType: "PHYSICAL", firstName: "Cliente", lastName: "Test", ci: null, ruc: null, email: null,
  phone: null, address: null, birthDate: null, notes: null, documents: [],
};
const tripInput: TripInput = {
  name: "Salida", packageId: null, startDate: new Date("2026-03-01"), endDate: new Date("2026-03-05"),
  capacity: 10, status: "SCHEDULED", salePrice: 1_000_000, saleCurrency: "PYG",
  destinationIds: [], itinerary: [], suppliers: [],
};
const bookingInput = (customerId: string, tripId: string): BookingInput => ({
  customerId, tripId, quoteId: null, paxCount: 1, totalAmount: 500_000, currency: "PYG", commissionRate: null, passengers: [],
});

describe("auditoría e integridad financiera", () => {
  it("registra en auditoría la creación de una reserva", async () => {
    const { tenant, admin } = await makeTenant();
    const cust = await ctx(tenant.id, admin.id, () => customers.createCustomer(customerInput));
    const trip = await ctx(tenant.id, admin.id, () => trips.createTrip(tripInput));
    await ctx(tenant.id, admin.id, () => bookings.createBooking(bookingInput(cust.id, trip.id)));

    const logs = await prismaBase.auditLog.findMany({ where: { tenantId: tenant.id, action: "booking.create" } });
    expect(logs.length).toBe(1);
    expect(logs[0]!.userId).toBe(admin.id);
  });

  it("no permite eliminar una reserva con pagos (protege el historial)", async () => {
    const { tenant, admin } = await makeTenant();
    const cust = await ctx(tenant.id, admin.id, () => customers.createCustomer(customerInput));
    const trip = await ctx(tenant.id, admin.id, () => trips.createTrip(tripInput));
    const booking = await ctx(tenant.id, admin.id, () => bookings.createBooking(bookingInput(cust.id, trip.id)));
    await ctx(tenant.id, admin.id, () => payments.createPayment(booking.id, { amount: 100_000, method: "CASH" }));

    await expect(ctx(tenant.id, admin.id, () => bookings.deleteBooking(booking.id))).rejects.toThrow(/pagos/i);
  });
});
