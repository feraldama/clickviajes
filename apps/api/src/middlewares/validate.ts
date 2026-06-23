import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

interface ValidateSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Middleware de validación con Zod. Valida body/query/params y reemplaza cada
 * sección por el dato ya parseado y tipado. Lanza ZodError (lo captura el
 * errorHandler) si la entrada es inválida.
 */
export function validate(schemas: ValidateSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as typeof req.query;
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      next();
    } catch (err) {
      next(err);
    }
  };
}
