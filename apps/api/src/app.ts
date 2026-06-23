import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { attachUser } from "./middlewares/auth.js";
import { tenantContext } from "./middlewares/tenant.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { customerRouter } from "./modules/customers/customer.routes.js";
import { destinationRouter } from "./modules/destinations/destination.routes.js";
import { supplierRouter } from "./modules/suppliers/supplier.routes.js";
import { exchangeRateRouter } from "./modules/exchange-rates/exchangeRate.routes.js";
import { packageRouter } from "./modules/packages/package.routes.js";
import { tripRouter } from "./modules/trips/trip.routes.js";

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
  app.use("/customers", customerRouter);
  app.use("/destinations", destinationRouter);
  app.use("/suppliers", supplierRouter);
  app.use("/exchange-rates", exchangeRateRouter);
  app.use("/packages", packageRouter);
  app.use("/trips", tripRouter);
  // Los siguientes módulos (cotizaciones, reservas, …) se montan en fases posteriores.

  // 404 + manejo central de errores (siempre al final)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
