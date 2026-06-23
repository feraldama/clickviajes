import rateLimit from "express-rate-limit";

/**
 * Limita intentos de autenticación para mitigar fuerza bruta.
 * 10 intentos por IP cada 15 minutos.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    ok: false,
    error: { code: "RATE_LIMITED", message: "Demasiados intentos. Intenta nuevamente en unos minutos." },
  },
});
