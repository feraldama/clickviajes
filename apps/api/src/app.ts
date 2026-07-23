import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { corsOrigins } from "./config/env.js";
import { attachUser } from "./middlewares/auth.js";
import { tenantContext } from "./middlewares/tenant.js";
import { requestLogger } from "./middlewares/request-logger.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { customerRouter } from "./modules/customers/customer.routes.js";
import { destinationRouter } from "./modules/destinations/destination.routes.js";
import { supplierRouter } from "./modules/suppliers/supplier.routes.js";
import { exchangeRateRouter } from "./modules/exchange-rates/exchangeRate.routes.js";
import { packageRouter } from "./modules/packages/package.routes.js";
import { tripRouter } from "./modules/trips/trip.routes.js";
import { quoteRouter } from "./modules/quotes/quote.routes.js";
import { bookingRouter } from "./modules/bookings/booking.routes.js";
import { paymentRouter } from "./modules/payments/payment.routes.js";
import { agendaRouter } from "./modules/agenda/agenda.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { planRouter } from "./modules/plans/plan.routes.js";
import { tenantRouter } from "./modules/tenants/tenant.routes.js";
import { userRouter } from "./modules/users/user.routes.js";
import { auditRouter } from "./modules/audit/audit.routes.js";

export function createApp() {
  const app = express();

  // Seguridad y parsing
  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Observabilidad: requestId + log por petición (antes de auth/rutas).
  app.use(requestLogger);

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
  app.use("/quotes", quoteRouter);
  app.use("/bookings", bookingRouter);
  app.use(paymentRouter); // /bookings/:id/account, /installments, /payments
  app.use("/agenda", agendaRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/plans", planRouter);
  app.use("/tenants", tenantRouter);
  app.use("/users", userRouter);
  app.use("/audit", auditRouter);

  // 404 + manejo central de errores (siempre al final)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
