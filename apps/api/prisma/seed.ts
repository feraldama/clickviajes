import bcrypt from "bcryptjs";
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
