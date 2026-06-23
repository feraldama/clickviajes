import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error.js";
import { sendError } from "../utils/api-response.js";
import { isProduction } from "../config/env.js";

/** Ruta no encontrada (404). */
export function notFoundHandler(req: Request, res: Response) {
  sendError(res, 404, "NOT_FOUND", `Ruta no encontrada: ${req.method} ${req.path}`);
}

/** Manejador central de errores. Última pieza del pipeline de Express. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  if (err instanceof ZodError) {
    return sendError(res, 400, "VALIDATION_ERROR", "Datos de entrada inválidos", err.flatten());
  }

  // Error no controlado.
  console.error("❌ Error no controlado:", err);
  return sendError(
    res,
    500,
    "INTERNAL_ERROR",
    "Ocurrió un error interno",
    isProduction ? undefined : String(err),
  );
}
