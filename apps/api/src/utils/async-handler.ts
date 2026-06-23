import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Envuelve un handler asíncrono para que cualquier excepción/rechazo se pase
 * al manejador central de errores (Express 4 no lo hace automáticamente).
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
