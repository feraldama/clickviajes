import { beforeEach, describe, expect, it } from "vitest";
import type { BookingInput, CustomerInput, SupplierInput, TripInput } from "@clickviajes/shared";
import { ctx, makeRate, makeTenant, resetDb } from "./helpers.js";
import * as customers from "../src/modules/customers/customer.service.js";
import * as suppliers from "../src/modules/suppliers/supplier.service.js";
import * as trips from "../src/modules/trips/trip.service.js";
import * as bookings from "../src/modules/bookings/booking.service.js";

beforeEach(resetDb);

const tripInput = (over: Partial<TripInput> = {}): TripInput => ({
  name: "Salida",
  packageId: null,
  startDate: new Date("2026-03-01"),
  endDate: new Date("2026-03-05"),
  capacity: 10,
  status: "SCHEDULED",
  salePrice: 1_000_000,
  saleCurrency: "PYG",
  destinationIds: [],
  itinerary: [],
  suppliers: [],
  ...over,
});

const customerInput = (over: Partial<CustomerInput> = {}): CustomerInput => ({
  firstName: "Cliente", lastName: "Test", ci: null, ruc: null, email: null, phone: null,
  address: null, birthDate: null, notes: null, documents: [], ...over,
});

const bookingInput = (over: Partial<BookingInput>): BookingInput => ({
  customerId: "", tripId: "", quoteId: null, paxCount: 1, totalAmount: 0,
  currency: "PYG", commissionRate: null, passengers: [], ...over,
});

describe("viajes y reservas", () => {
  it("calcula el margen convertido a la moneda base", async () => {
    const { tenant, admin } = await makeTenant({ baseCurrency: "PYG" });
    await makeRate(tenant.id, "USD", "PYG", 7600);

    const sup = await ctx(tenant.id, admin.id, () =>
      suppliers.createSupplier({ name: "Hotel", type: "HOTEL", email: null, phone: null, notes: null } satisfies SupplierInput),
    );
    const trip = await ctx(tenant.id, admin.id, () =>
      trips.createTrip(tripInput({ salePrice: 1_000_000, saleCurrency: "PYG", suppliers: [{ supplierId: sup.id, description: null, cost: 100, costCurrency: "USD" }] })),
    );

    expect(trip.margin.salePriceBase).toBe(1_000_000);
    expect(trip.margin.totalCostBase).toBe(760_000); // 100 USD * 7600
    expect(trip.margin.margin).toBe(240_000);
    expect(trip.margin.incomplete).toBe(false);
  });

  it("previene la sobreventa de cupos", async () => {
    const { tenant, admin } = await makeTenant();
    const trip = await ctx(tenant.id, admin.id, () => trips.createTrip(tripInput({ capacity: 5 })));
    const cust = await ctx(tenant.id, admin.id, () => customers.createCustomer(customerInput()));

    // 3 plazas: OK
    await ctx(tenant.id, admin.id, () =>
      bookings.createBooking(bookingInput({ customerId: cust.id, tripId: trip.id, paxCount: 3, totalAmount: 100 })),
    );
    // otras 3 (total 6 > 5): debe fallar
    await expect(
      ctx(tenant.id, admin.id, () =>
        bookings.createBooking(bookingInput({ customerId: cust.id, tripId: trip.id, paxCount: 3, totalAmount: 100 })),
      ),
    ).rejects.toThrow();

    const after = await ctx(tenant.id, admin.id, () => trips.getTrip(trip.id));
    expect(after.bookedSeats).toBe(3);
    expect(after.availableSeats).toBe(2);
  });

  it("libera el cupo al cancelar la reserva", async () => {
    const { tenant, admin } = await makeTenant();
    const trip = await ctx(tenant.id, admin.id, () => trips.createTrip(tripInput({ capacity: 5 })));
    const cust = await ctx(tenant.id, admin.id, () => customers.createCustomer(customerInput()));
    const b = await ctx(tenant.id, admin.id, () =>
      bookings.createBooking(bookingInput({ customerId: cust.id, tripId: trip.id, paxCount: 3, totalAmount: 100 })),
    );
    await ctx(tenant.id, admin.id, () => bookings.changeBookingStatus(b.id, "CANCELLED"));
    const after = await ctx(tenant.id, admin.id, () => trips.getTrip(trip.id));
    expect(after.bookedSeats).toBe(0);
  });
});
