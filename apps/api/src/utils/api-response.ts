import type { Response } from "express";

/** Respuesta exitosa con formato consistente: { ok: true, data }. */
export function sendOk<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ ok: true, data });
}

/** Respuesta de error con formato consistente: { ok: false, error }. */
export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return res.status(status).json({ ok: false, error: { code, message, details } });
}
