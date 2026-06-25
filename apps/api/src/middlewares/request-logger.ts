import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

/**
 * Asigna un `requestId` corto a cada petición (expuesto en `X-Request-Id`) y
 * loguea método, ruta, estado, duración, tenant y usuario al finalizar.
 * Silencioso en tests. Escribe a stdout/stderr (estándar para contenedores).
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  req.id = randomUUID().slice(0, 8);
  res.setHeader("X-Request-Id", req.id);

  if (env.NODE_ENV === "test") return next();

  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const tenant = req.auth?.tenantId ?? "-";
    const user = req.auth?.userId ?? "-";
    const line = `${req.id} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms tenant=${tenant} user=${user}`;
    if (res.statusCode >= 500) console.error(line);
    else console.log(line);
  });

  next();
}
