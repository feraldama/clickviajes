import type { NextFunction, Request, Response } from "express";
import { tenantStore } from "../lib/tenant-context.js";
import { isProduction } from "../config/env.js";

/**
 * Middleware que establece el contexto de tenant para todo el request.
 *
 * Resolución del tenant (login unificado: el tenant viene del usuario):
 *  - Si un middleware de autenticación previo dejó `req.auth`, se usa de ahí.
 *  - En desarrollo, como apoyo para pruebas mientras no exista auth (Fase 2),
 *    se acepta la cabecera `x-tenant-id`.
 *
 * Envuelve el resto del pipeline dentro del AsyncLocalStorage para que la
 * extensión de Prisma aísle automáticamente por agencia.
 */
export function tenantContext(req: Request, _res: Response, next: NextFunction) {
  const auth = req.auth;

  let tenantId: string | null = auth?.tenantId ?? null;
  if (!tenantId && !isProduction) {
    tenantId = req.header("x-tenant-id") ?? null;
  }

  tenantStore.run({ tenantId, userId: auth?.userId, role: auth?.role }, () => next());
}
