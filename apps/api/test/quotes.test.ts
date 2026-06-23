import { beforeEach, describe, expect, it } from "vitest";
import type { CustomerInput, TripInput } from "@clickviajes/shared";
import { ctx, makeTenant, resetDb } from "./helpers.js";
import * as customers from "../src/modules/customers/customer.service.js";
import * as quotes from "../src/modules/quotes/quote.service.js";
import * as trips from "../src/modules/trips/trip.service.js";
import * as bookings from "../src/modules/bookings/booking.service.js";

beforeEach(resetDb);

const customerInput: CustomerInput = {
  firstName: "Cliente", lastName: "Test", ci: null, ruc: null, email: null, phone: null,
  address: null, birthDate: null, notes: null, documents: [],
};

const listQuery = { page: 1, pageSize: 20, sortBy: "createdAt" as const, sortDir: "desc" as const };

describe("cotizaciones — vencimiento", () => {
  it("marca como EXPIRED las cotizaciones pasadas su validez", async () => {
    const { tenant, admin } = await makeTenant();
    const cust = await ctx(tenant.id, admin.id, () => customers.createCustomer(customerInput));
    await ctx(tenant.id, admin.id, () =>
      quotes.createQuote({ customerId: cust.id, tripId: null, totalAmount: 100, currency: "PYG", validUntil: new Date("2020-01-01"), notes: null }),
    );

    const list = await ctx(tenant.id, admin.id, () => quotes.listQuotes(listQuery));
    expect((list.items[0] as { status: string }).status).toBe("EXPIRED");
  });

  it("no permite convertir en reserva una cotización vencida", async () => {
    const { tenant, admin } = await makeTenant();
    const cust = await ctx(tenant.id, admin.id, () => customers.createCustomer(customerInput));
    const trip = await ctx(tenant.id, admin.id, () =>
      trips.createTrip({
        name: "T", packageId: null, startDate: new Date("2026-03-01"), endDate: new Date("2026-03-05"),
        capacity: 10, status: "SCHEDULED", salePrice: 100, saleCurrency: "PYG",
        destinationIds: [], itinerary: [], suppliers: [],
      } satisfies TripInput),
    );
    const quote = await ctx(tenant.id, admin.id, () =>
      quotes.createQuote({ customerId: cust.id, tripId: trip.id, totalAmount: 100, currency: "PYG", validUntil: new Date("2020-01-01"), notes: null }),
    );

    await expect(
      ctx(tenant.id, admin.id, () =>
        bookings.createBooking({ customerId: cust.id, tripId: trip.id, quoteId: quote.id, paxCount: 1, totalAmount: 100, currency: "PYG", commissionRate: null, passengers: [] }),
      ),
    ).rejects.toThrow(/vencida/i);
  });
});
