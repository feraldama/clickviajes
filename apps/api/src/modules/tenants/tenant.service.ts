import bcrypt from "bcryptjs";
import type { CreateTenantInput, UpdateTenantInput } from "@clickviajes/shared";
import { prismaBase } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { recordAudit } from "../../lib/audit.js";
import { AppError } from "../../utils/app-error.js";

const include = {
  plan: { select: { id: true, name: true, maxUsers: true } },
  _count: { select: { users: true } },
} as const;

export async function listTenants() {
  return prismaBase.tenant.findMany({ include, orderBy: { createdAt: "desc" } });
}

export async function createTenant(input: CreateTenantInput) {
  // slug y email únicos → si chocan, P2002 → 409 (manejado por errorHandler).
  const created = await prismaBase.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: input.name,
        slug: input.slug,
        baseCurrency: input.baseCurrency,
        status: "ACTIVE",
        planId: input.planId || null,
        maxUsers: input.maxUsers ?? null,
      },
    });
    await tx.user.create({
      data: {
        tenantId: tenant.id,
        email: input.adminEmail,
        passwordHash: bcrypt.hashSync(input.adminPassword, env.BCRYPT_ROUNDS),
        fullName: input.adminName,
        role: "AGENCY_ADMIN",
      },
    });
    return tx.tenant.findUnique({ where: { id: tenant.id }, include });
  });
  await recordAudit("tenant.create", "Tenant", created?.id ?? null, `Agencia creada: ${input.name} (${input.slug})`);
  return created;
}

export async function updateTenant(id: string, input: UpdateTenantInput) {
  const tenant = await prismaBase.tenant.findUnique({ where: { id } });
  if (!tenant) throw AppError.notFound("Agencia no encontrada");
  const updated = await prismaBase.tenant.update({
    where: { id },
    data: {
      name: input.name,
      status: input.status,
      baseCurrency: input.baseCurrency,
      planId: input.planId || null,
      maxUsers: input.maxUsers ?? null,
    },
    include,
  });
  await recordAudit("tenant.update", "Tenant", id, `Agencia actualizada: ${input.name} · ${input.status}`);
  return updated;
}
