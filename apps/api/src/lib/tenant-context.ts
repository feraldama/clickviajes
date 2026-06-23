import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Contexto por request que viaja con el flujo asíncrono.
 * Lo setea el middleware de tenant tras autenticar, y lo lee la extensión de
 * Prisma para aislar automáticamente los datos por agencia.
 */
export interface TenantContext {
  /** Tenant activo. `null` = operación de plataforma (SUPER_ADMIN). */
  tenantId: string | null;
  userId?: string;
  role?: string;
}

export const tenantStore = new AsyncLocalStorage<TenantContext>();

/** Ejecuta `fn` dentro de un contexto de tenant. */
export function runWithTenant<T>(ctx: TenantContext, fn: () => T): T {
  return tenantStore.run(ctx, fn);
}

/** Devuelve el contexto actual, si existe. */
export function getTenantContext(): TenantContext | undefined {
  return tenantStore.getStore();
}

/** Devuelve el tenantId activo (o null si es plataforma / sin contexto). */
export function currentTenantId(): string | null {
  return tenantStore.getStore()?.tenantId ?? null;
}
