import { beforeEach, describe, expect, it } from "vitest";
import type { BookingInput, CustomerInput, TripInput } from "@clickviajes/shared";
import { ctx, makeTenant, resetDb } from "./helpers.js";
import * as customers from "../src/modules/customers/customer.service.js";
import * as trips from "../src/modules/trips/trip.service.js";
import * as bookings from "../src/modules/bookings/booking.service.js";
import * as payments from "../src/modules/payments/payment.service.js";

beforeEach(resetDb);

async function setupBooking() {
  const { tenant, admin } = await makeTenant();
  const trip = await ctx(tenant.id, admin.id, () =>
    trips.createTrip({
      name: "Salida", packageId: null, startDate: new Date("2026-03-01"), endDate: new Date("2026-03-05"),
      capacity: 10, status: "SCHEDULED", salePrice: 1_000_000, saleCurrency: "PYG",
      destinationIds: [], itinerary: [], suppliers: [],
    } satisfies TripInput),
  );
  const cust = await ctx(tenant.id, admin.id, () =>
    customers.createCustomer({
      firstName: "Cliente", lastName: "Test", ci: null, ruc: null, email: null, phone: null,
      address: null, birthDate: null, notes: null, documents: [],
    } satisfies CustomerInput),
  );
  const booking = await ctx(tenant.id, admin.id, () =>
    bookings.createBooking({
      customerId: cust.id, tripId: trip.id, quoteId: null, paxCount: 2,
      totalAmount: 1_000_000, currency: "PYG", commissionRate: null, passengers: [],
    } satisfies BookingInput),
  );
  return { tenant, admin, booking };
}

describe("pagos y estado de cuenta", () => {
  it("calcula saldo y estados de cuota con pagos parciales", async () => {
    const { tenant, admin, booking } = await setupBooking();

    await ctx(tenant.id, admin.id, () =>
      payments.setInstallments(booking.id, {
        installments: [
          { dueDate: new Date("2026-07-01"), amount: 500_000 },
          { dueDate: new Date("2026-08-01"), amount: 500_000 },
        ],
      }),
    );

    const account1 = await ctx(tenant.id, admin.id, () => payments.getAccount(booking.id));
    const inst1 = account1.installments[0]!;
    const inst2 = account1.installments[1]!;
    expect(account1.total).toBe(1_000_000);
    expect(account1.balance).toBe(1_000_000);

    // Pago total de la cuota 1 y parcial de la 2
    await ctx(tenant.id, admin.id, () => payments.createPayment(booking.id, { amount: 500_000, method: "TRANSFER", installmentId: inst1.id }));
    await ctx(tenant.id, admin.id, () => payments.createPayment(booking.id, { amount: 200_000, method: "CASH", installmentId: inst2.id }));

    const account2 = await ctx(tenant.id, admin.id, () => payments.getAccount(booking.id));
    expect(account2.paid).toBe(700_000);
    expect(account2.balance).toBe(300_000);
    expect(account2.installments[0]!.status).toBe("PAID");
    expect(account2.installments[1]!.status).toBe("PARTIAL");
  });

  it("no permite cambiar el plan si ya hay pagos", async () => {
    const { tenant, admin, booking } = await setupBooking();
    await ctx(tenant.id, admin.id, () =>
      payments.setInstallments(booking.id, { installments: [{ dueDate: new Date("2026-07-01"), amount: 1_000_000 }] }),
    );
    await ctx(tenant.id, admin.id, () => payments.createPayment(booking.id, { amount: 100_000, method: "CASH" }));

    await expect(
      ctx(tenant.id, admin.id, () =>
        payments.setInstallments(booking.id, { installments: [{ dueDate: new Date("2026-09-01"), amount: 1_000_000 }] }),
      ),
    ).rejects.toThrow();
  });
});
