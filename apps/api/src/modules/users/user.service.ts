import bcrypt from "bcryptjs";
import type { CreateUserInput, UpdateUserInput } from "@clickviajes/shared";
import type { User } from "@prisma/client";
import { prismaBase } from "../../lib/prisma.js";
import { currentTenantId } from "../../lib/tenant-context.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";

function toDTO(u: User) {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    commissionRate: u.commissionRate ? u.commissionRate.toString() : null,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
  };
}

/** Tope efectivo de usuarios: el del tenant o, si no, el del plan (null = sin límite). */
async function effectiveMaxUsers(tenantId: string): Promise<number | null> {
  const tenant = await prismaBase.tenant.findUnique({ where: { id: tenantId }, include: { plan: true } });
  if (!tenant) return null;
  return tenant.maxUsers ?? tenant.plan?.maxUsers ?? null;
}

function requireTenant(): string {
  const tenantId = currentTenantId();
  if (!tenantId) throw AppError.forbidden("Solo disponible para usuarios de una agencia");
  return tenantId;
}

export async function listUsers() {
  const tenantId = requireTenant();
  const [items, max] = await Promise.all([
    prismaBase.user.findMany({ where: { tenantId }, orderBy: { fullName: "asc" } }),
    effectiveMaxUsers(tenantId),
  ]);
  const used = items.filter((u) => u.isActive).length;
  return { items: items.map(toDTO), used, max };
}

export async function createUser(input: CreateUserInput) {
  const tenantId = requireTenant();
  const max = await effectiveMaxUsers(tenantId);
  if (max !== null) {
    const used = await prismaBase.user.count({ where: { tenantId, isActive: true } });
    if (used >= max) throw AppError.conflict(`Alcanzaste el límite de usuarios de tu plan (${max}). Mejóralo para agregar más.`);
  }
  const user = await prismaBase.user.create({
    data: {
      tenantId,
      email: input.email,
      passwordHash: bcrypt.hashSync(input.password, env.BCRYPT_ROUNDS),
      fullName: input.fullName,
      role: input.role,
      commissionRate: input.commissionRate ?? null,
    },
  });
  return toDTO(user);
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const tenantId = requireTenant();
  const existing = await prismaBase.user.findFirst({ where: { id, tenantId } });
  if (!existing) throw AppError.notFound("Usuario no encontrado");

  // Reactivar un usuario también cuenta contra el límite.
  if (input.isActive && !existing.isActive) {
    const max = await effectiveMaxUsers(tenantId);
    if (max !== null) {
      const used = await prismaBase.user.count({ where: { tenantId, isActive: true } });
      if (used >= max) throw AppError.conflict(`Alcanzaste el límite de usuarios de tu plan (${max}).`);
    }
  }

  const data: { fullName: string; role: CreateUserInput["role"]; commissionRate: number | null; isActive: boolean; passwordHash?: string } = {
    fullName: input.fullName,
    role: input.role,
    commissionRate: input.commissionRate ?? null,
    isActive: input.isActive,
  };
  if (input.password) data.passwordHash = bcrypt.hashSync(input.password, env.BCRYPT_ROUNDS);

  return toDTO(await prismaBase.user.update({ where: { id }, data }));
}
