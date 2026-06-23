import bcrypt from "bcryptjs";
import { calcularRuc } from "@clickviajes/shared";
import { prismaBase } from "../src/lib/prisma.js";
import { env } from "../src/config/env.js";

/**
 * Seed de datos iniciales:
 *  - 1 super-admin de plataforma (sin tenant).
 *  - 1 agencia demo (tenant) con moneda base PYG.
 *  - 1 admin de agencia y 1 vendedor.
 *  - Tipos de cambio de ejemplo para la agencia demo.
 *
 * Idempotente: usa upsert por campos únicos.
 */
async function main() {
  const rounds = env.BCRYPT_ROUNDS;

  // ───── Super-admin de plataforma (tenantId = null) ─────
  const superAdmin = await prismaBase.user.upsert({
    where: { email: "superadmin@clickviajes.com" },
    update: {},
    create: {
      email: "superadmin@clickviajes.com",
      passwordHash: bcrypt.hashSync("superadmin123", rounds),
      fullName: "Super Administrador",
      role: "SUPER_ADMIN",
      tenantId: null,
    },
  });

  // ───── Agencia demo (tenant) ─────
  const tenant = await prismaBase.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Agencia Demo",
      slug: "demo",
      baseCurrency: "PYG",
      status: "ACTIVE",
    },
  });

  // ───── Usuarios de la agencia ─────
  const admin = await prismaBase.user.upsert({
    where: { email: "admin@demo.com" },
    update: { tenantId: tenant.id },
    create: {
      email: "admin@demo.com",
      passwordHash: bcrypt.hashSync("admin123", rounds),
      fullName: "Administrador Demo",
      role: "AGENCY_ADMIN",
      tenantId: tenant.id,
    },
  });

  const seller = await prismaBase.user.upsert({
    where: { email: "vendedor@demo.com" },
    update: { tenantId: tenant.id },
    create: {
      email: "vendedor@demo.com",
      passwordHash: bcrypt.hashSync("vendedor123", rounds),
      fullName: "Vendedor Demo",
      role: "SELLER",
      commissionRate: "10.00",
      tenantId: tenant.id,
    },
  });

  // ───── Tipos de cambio de ejemplo (a PYG) ─────
  // Se borran los previos de la agencia demo para mantener idempotencia.
  await prismaBase.exchangeRate.deleteMany({ where: { tenantId: tenant.id } });
  const hoy = new Date();
  await prismaBase.exchangeRate.createMany({
    data: [
      { tenantId: tenant.id, fromCurrency: "USD", toCurrency: "PYG", rate: "7600.000000", date: hoy },
      { tenantId: tenant.id, fromCurrency: "BRL", toCurrency: "PYG", rate: "1400.000000", date: hoy },
      { tenantId: tenant.id, fromCurrency: "ARS", toCurrency: "PYG", rate: "7.500000", date: hoy },
    ],
  });

  // ───── Datos de muestra de la agencia demo (solo si está vacía) ─────
  const yaTieneDatos = (await prismaBase.customer.count({ where: { tenantId: tenant.id } })) > 0;
  if (!yaTieneDatos) {
    const iguazu = await prismaBase.destination.create({
      data: {
        tenantId: tenant.id,
        name: "Cataratas del Iguazú",
        country: "Argentina",
        city: "Puerto Iguazú",
        description: "Una de las maravillas naturales del mundo, en la triple frontera.",
        recommendedSeason: "Marzo a noviembre",
        photos: [],
        attractions: {
          create: [
            { tenantId: tenant.id, name: "Garganta del Diablo", description: "El salto más imponente." },
            { tenantId: tenant.id, name: "Paseo Superior", description: "Vista panorámica de las cataratas." },
          ],
        },
      },
    });
    await prismaBase.destination.create({
      data: {
        tenantId: tenant.id,
        name: "Río de Janeiro",
        country: "Brasil",
        city: "Río de Janeiro",
        description: "Playas, Cristo Redentor y Pan de Azúcar.",
        recommendedSeason: "Todo el año",
        photos: [],
      },
    });

    const hotel = await prismaBase.supplier.create({
      data: { tenantId: tenant.id, name: "Hotel Cataratas", type: "HOTEL", email: "reservas@hotelcataratas.com" },
    });

    await prismaBase.package.create({
      data: {
        tenantId: tenant.id,
        name: "Iguazú Clásico 3 días",
        description: "Lado argentino + lado brasileño con guía.",
        basePrice: "1200.0000",
        currency: "USD",
        destinations: { create: [{ destinationId: iguazu.id }] },
        itinerary: {
          create: [
            { dayNumber: 1, title: "Llegada y city tour", description: "Recepción y traslado al hotel." },
            { dayNumber: 2, title: "Cataratas lado argentino" },
            { dayNumber: 3, title: "Cataratas lado brasileño y regreso" },
          ],
        },
      },
    });

    const start = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10);
    const end = new Date(start);
    end.setDate(end.getDate() + 3);
    await prismaBase.trip.create({
      data: {
        tenantId: tenant.id,
        name: "Salida Iguazú — próximo mes",
        startDate: start,
        endDate: end,
        capacity: 20,
        salePrice: "2500000.0000",
        saleCurrency: "PYG",
        status: "SCHEDULED",
        destinations: { create: [{ destinationId: iguazu.id }] },
        suppliers: {
          create: [{ tenantId: tenant.id, supplierId: hotel.id, description: "Alojamiento 3 noches", cost: "150.0000", costCurrency: "USD" }],
        },
      },
    });

    for (const [firstName, lastName, ci] of [
      ["María", "González", "1234567"],
      ["Carlos", "Benítez", "4185050"],
    ] as const) {
      await prismaBase.customer.create({
        data: { tenantId: tenant.id, firstName, lastName, ci, ruc: calcularRuc(ci) },
      });
    }
  }

  console.log("✅ Seed completado:");
  console.log(`   Super-admin: ${superAdmin.email} / superadmin123`);
  console.log(`   Agencia:     ${tenant.name} (slug: ${tenant.slug}, id: ${tenant.id})`);
  console.log(`   Admin:       ${admin.email} / admin123`);
  console.log(`   Vendedor:    ${seller.email} / vendedor123`);
  console.log(`   Tipos de cambio de ejemplo cargados (USD/BRL/ARS -> PYG).`);
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaBase.$disconnect();
  });
