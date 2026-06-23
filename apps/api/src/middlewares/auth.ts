import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { currentTenantId } from "../lib/tenant-context.js";
import { AppError } from "../utils/app-error.js";

/**
 * Decodifica el access token (si viene en `Authorization: Bearer`) y adjunta
 * `req.auth`. No falla si no hay token o es inválido: las rutas protegidas lo
 * exigen con `requireAuth`/`requireRole`. Debe ejecutarse ANTES del middleware
 * de tenant para que éste pueda leer el tenant del usuario.
 */
export function attachUser(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = verifyAccessToken(header.slice(7));
      req.auth = { userId: payload.sub, tenantId: payload.tenantId, role: payload.role };
    } catch {
      // Token inválido/expirado: se ignora aquí; lo rechaza requireAuth.
    }
  }
  next();
}

/** Exige usuario autenticado. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth?.userId) return next(AppError.unauthorized());
  next();
}

/**
 * Exige que la operación se realice dentro de una agencia (tenant en contexto).
 * Bloquea endpoints de negocio para el super-admin de plataforma (sin tenant).
 */
export function requireTenant(_req: Request, _res: Response, next: NextFunction) {
  if (!currentTenantId()) {
    return next(AppError.forbidden("Esta operación pertenece a una agencia y no está disponible para la plataforma."));
  }
  next();
}

/** Exige que el usuario tenga uno de los roles indicados. */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth?.role) return next(AppError.unauthorized());
    if (!roles.includes(req.auth.role)) return next(AppError.forbidden("No tienes permisos para esta acción"));
    next();
  };
}
