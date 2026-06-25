import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/app-error.js";
import { sendError } from "../utils/api-response.js";
import { isProduction } from "../config/env.js";

/** Ruta no encontrada (404). */
export function notFoundHandler(req: Request, res: Response) {
  sendError(res, 404, "NOT_FOUND", `Ruta no encontrada: ${req.method} ${req.path}`);
}

/** Manejador central de errores. Última pieza del pipeline de Express. */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  if (err instanceof ZodError) {
    return sendError(res, 400, "VALIDATION_ERROR", "Datos de entrada inválidos", err.flatten());
  }

  // Errores conocidos de Prisma → respuestas amigables.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return sendError(res, 409, "CONFLICT", "Ya existe un registro con esos datos únicos");
    }
    if (err.code === "P2003") {
      return sendError(res, 409, "IN_USE", "No se puede completar: el recurso está en uso o referencia datos inexistentes");
    }
    if (err.code === "P2025") {
      return sendError(res, 404, "NOT_FOUND", "Recurso no encontrado");
    }
  }

  // Error no controlado.
  console.error(`❌ [${req.id ?? "-"}] Error no controlado:`, err);
  return sendError(
    res,
    500,
    "INTERNAL_ERROR",
    "Ocurrió un error interno",
    { requestId: req.id, ...(isProduction ? {} : { detail: String(err) }) },
  );
}
