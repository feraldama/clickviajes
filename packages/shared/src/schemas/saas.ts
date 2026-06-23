import { z } from "zod";
import { AGENCY_ROLES, CURRENCIES, TENANT_STATUSES } from "../constants";

const slug = z
  .string()
  .min(2, "Mínimo 2 caracteres")
  .max(60)
  .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones");

// ───────────── Planes ─────────────
export const planSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  maxUsers: z.coerce.number().int().positive().optional().nullable(),
  price: z.coerce.number().nonnegative().optional().nullable(),
  currency: z.enum(CURRENCIES).default("USD"),
});
export type PlanInput = z.infer<typeof planSchema>;

// ───────────── Agencias (tenants) — super-admin ─────────────
export const createTenantSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(150),
  slug,
  baseCurrency: z.enum(CURRENCIES).default("PYG"),
  planId: z.string().optional().nullable(),
  maxUsers: z.coerce.number().int().positive().optional().nullable(),
  adminName: z.string().min(1, "Nombre del administrador requerido").max(120),
  adminEmail: z.string().email("Email inválido"),
  adminPassword: z.string().min(6, "Mínimo 6 caracteres"),
});
export type CreateTenantInput = z.infer<typeof createTenantSchema>;

export const updateTenantSchema = z.object({
  name: z.string().min(1).max(150),
  status: z.enum(TENANT_STATUSES),
  baseCurrency: z.enum(CURRENCIES),
  planId: z.string().optional().nullable(),
  maxUsers: z.coerce.number().int().positive().optional().nullable(),
});
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

// ───────────── Registro público de agencia (onboarding) ─────────────
export const registerAgencySchema = z.object({
  name: z.string().min(1, "El nombre de la agencia es obligatorio").max(150),
  slug,
  baseCurrency: z.enum(CURRENCIES).default("PYG"),
  adminName: z.string().min(1, "Tu nombre es obligatorio").max(120),
  adminEmail: z.string().email("Email inválido"),
  adminPassword: z.string().min(6, "Mínimo 6 caracteres"),
});
export type RegisterAgencyInput = z.infer<typeof registerAgencySchema>;

// ───────────── Usuarios (gestión dentro de la agencia) ─────────────
export const createUserSchema = z.object({
  fullName: z.string().min(1, "El nombre es obligatorio").max(120),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  role: z.enum(AGENCY_ROLES),
  commissionRate: z.coerce.number().min(0).max(100).optional().nullable(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  fullName: z.string().min(1).max(120),
  role: z.enum(AGENCY_ROLES),
  commissionRate: z.coerce.number().min(0).max(100).optional().nullable(),
  isActive: z.boolean().default(true),
  password: z.string().min(6).optional().or(z.literal("")).nullable(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
