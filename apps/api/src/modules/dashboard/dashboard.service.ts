import type { Currency, DashboardData } from "@clickviajes/shared";
import { Prisma } from "@prisma/client";
import { prisma, prismaBase } from "../../lib/prisma.js";
import { currentTenantId } from "../../lib/tenant-context.js";
import { buildConverter } from "../../lib/currency.js";
import { AppError } from "../../utils/app-error.js";

const Decimal = Prisma.Decimal;

export async function getDashboard(from?: Date, to?: Date): Promise<DashboardData> {
  const tenantId = currentTenantId();
  if (!tenantId) throw AppError.unauthorized("Sin agencia en contexto");

  // Período por defecto: últimos 6 meses.
  const now = to ?? new Date();
  const start = from ?? new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const tenant = await prismaBase.tenant.findUnique({ where: { id: tenantId } });
  const base = (tenant?.baseCurrency ?? "PYG") as Currency;
  const conv = await buildConverter();
  let incomplete = false;

  const [customers, bookings, payments, trips, users] = await Promise.all([
    prisma.customer.count(),
    prisma.booking.findMany({
      where: { status: { not: "CANCELLED" } },
      select: { id: true, totalAmount: true, currency: true, commissionAmount: true, sellerId: true, paxCount: true, tripId: true },
    }),
    prisma.payment.findMany({ select: { amount: true, currency: true, paidAt: true, bookingId: true } }),
    prisma.trip.findMany({ select: { id: true, name: true, capacity: true, bookedSeats: true, status: true } }),
    prismaBase.user.findMany({ where: { tenantId }, select: { id: true, fullName: true } }),
  ]);

  const activeIds = new Set(bookings.map((b) => b.id));
  const tripName = new Map(trips.map((t) => [t.id, t.name]));
  const sellerName = new Map(users.map((u) => [u.id, u.fullName]));

  const toBase = (amount: Prisma.Decimal | number | string, cur: Currency): Prisma.Decimal => {
    const c = conv(amount, cur, base);
    if (c === null) {
      incomplete = true;
      return new Decimal(0);
    }
    return c;
  };

  // Ingresos del período + ingresos por mes
  let revenue = new Decimal(0);
  const monthMap = new Map<string, Prisma.Decimal>();
  for (const p of payments) {
    if (p.paidAt < start || p.paidAt > now) continue;
    const c = toBase(p.amount, p.currency as Currency);
    revenue = revenue.plus(c);
    const month = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(month, (monthMap.get(month) ?? new Decimal(0)).plus(c));
  }

  // Cuentas por cobrar = total de reservas activas − pagos imputados a ellas
  let totalActive = new Decimal(0);
  for (const b of bookings) totalActive = totalActive.plus(toBase(b.totalAmount, b.currency as Currency));
  let paidActive = new Decimal(0);
  for (const p of payments) {
    if (activeIds.has(p.bookingId)) paidActive = paidActive.plus(toBase(p.amount, p.currency as Currency));
  }
  const receivable = totalActive.minus(paidActive);

  // Ocupación (viajes programados / en curso)
  let bookedSeats = 0;
  let capacity = 0;
  for (const t of trips) {
    if (t.status === "SCHEDULED" || t.status === "IN_PROGRESS") {
      bookedSeats += t.bookedSeats;
      capacity += t.capacity;
    }
  }

  // Viajes más vendidos
  const tripAgg = new Map<string, { pax: number; bookings: number }>();
  for (const b of bookings) {
    const a = tripAgg.get(b.tripId) ?? { pax: 0, bookings: 0 };
    a.pax += b.paxCount;
    a.bookings += 1;
    tripAgg.set(b.tripId, a);
  }
  const topTrips = [...tripAgg.entries()]
    .map(([id, a]) => ({ id, name: tripName.get(id) ?? "—", pax: a.pax, bookings: a.bookings }))
    .sort((x, y) => y.pax - x.pax)
    .slice(0, 5);

  // Desempeño por vendedor
  const sellerAgg = new Map<string, { sales: Prisma.Decimal; commission: Prisma.Decimal; bookings: number }>();
  for (const b of bookings) {
    const a = sellerAgg.get(b.sellerId) ?? { sales: new Decimal(0), commission: new Decimal(0), bookings: 0 };
    a.sales = a.sales.plus(toBase(b.totalAmount, b.currency as Currency));
    if (b.commissionAmount) a.commission = a.commission.plus(toBase(b.commissionAmount, b.currency as Currency));
    a.bookings += 1;
    sellerAgg.set(b.sellerId, a);
  }
  const sellers = [...sellerAgg.entries()]
    .map(([id, a]) => ({ id, name: sellerName.get(id) ?? "—", sales: a.sales.toNumber(), commission: a.commission.toNumber(), bookings: a.bookings }))
    .sort((x, y) => y.sales - x.sales);

  // Ingresos por mes (rellena meses del período)
  const revenueByMonth: Array<{ month: string; amount: number }> = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    revenueByMonth.push({ month: key, amount: (monthMap.get(key) ?? new Decimal(0)).toNumber() });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return {
    baseCurrency: base,
    incomplete,
    revenue: revenue.toNumber(),
    receivable: receivable.toNumber(),
    activeBookings: bookings.length,
    customers,
    occupancy: { booked: bookedSeats, capacity, pct: capacity > 0 ? Math.round((bookedSeats / capacity) * 100) : 0 },
    topTrips,
    sellers,
    revenueByMonth,
  };
}
