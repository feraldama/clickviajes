import bcrypt from "bcryptjs";
import type { Currency } from "@clickviajes/shared";
import { prismaBase } from "../src/lib/prisma.js";
import { runWithTenant } from "../src/lib/tenant-context.js";

const TABLES = [
  "Payment", "Installment", "Passenger", "Booking", "Quote",
  "TripSupplier", "TripItineraryItem", "TripDestination", "Trip",
  "PackageItineraryItem", "PackageDestination", "Package",
  "Supplier", "Attraction", "Destination", "CustomerDocument", "Customer",
  "ExchangeRate", "RefreshToken", "User", "Tenant", "Plan",
];

/** Vacía todas las tablas entre tests. */
export async function resetDb() {
  await prismaBase.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`,
  );
}

let seq = 0;

interface TenantOpts {
  baseCurrency?: Currency;
  maxUsers?: number | null;
  planMaxUsers?: number | null;
  status?: "ACTIVE" | "SUSPENDED";
}

/** Crea un tenant (opcionalmente con plan) y su usuario admin (password: secret123). */
export async function makeTenant(opts: TenantOpts = {}) {
  seq++;
  let planId: string | null = null;
  if (opts.planMaxUsers != null) {
    const plan = await prismaBase.plan.create({
      data: { name: `Plan${seq}`, maxUsers: opts.planMaxUsers, currency: "USD" },
    });
    planId = plan.id;
  }
  const tenant = await prismaBase.tenant.create({
    data: {
      name: `Tenant${seq}`,
      slug: `t${seq}`,
      baseCurrency: opts.baseCurrency ?? "PYG",
      status: opts.status ?? "ACTIVE",
      planId,
      maxUsers: opts.maxUsers ?? null,
    },
  });
  const admin = await prismaBase.user.create({
    data: {
      tenantId: tenant.id,
      email: `admin${seq}@test.com`,
      passwordHash: bcrypt.hashSync("secret123", 4),
      fullName: `Admin ${seq}`,
      role: "AGENCY_ADMIN",
      commissionRate: "10",
    },
  });
  return { tenant, admin };
}

/** Ejecuta `fn` dentro del contexto de tenant (como lo haría el middleware). */
export function ctx<T>(tenantId: string, userId: string, fn: () => Promise<T>): Promise<T> {
  return runWithTenant({ tenantId, userId, role: "AGENCY_ADMIN" }, fn);
}

/** Crea una tasa de cambio para el tenant. */
export async function makeRate(tenantId: string, from: Currency, to: Currency, rate: number) {
  await prismaBase.exchangeRate.create({
    data: { tenantId, fromCurrency: from, toCurrency: to, rate: rate.toString(), date: new Date("2020-01-01") },
  });
}
