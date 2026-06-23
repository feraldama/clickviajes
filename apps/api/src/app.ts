import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { attachUser } from "./middlewares/auth.js";
import { tenantContext } from "./middlewares/tenant.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";

export function createApp() {
  const app = express();

  // Seguridad y parsing
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Autenticación: decodifica el token (si existe) ANTES del tenant…
  app.use(attachUser);
  // …y el contexto de tenant (aislamiento multi-tenant) lee el usuario.
  app.use(tenantContext);

  // Rutas
  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  // Los siguientes módulos (customers, destinos, …) se montan en fases posteriores.

  // 404 + manejo central de errores (siempre al final)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
