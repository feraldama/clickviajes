import { Router } from "express";
import { z } from "zod";
import { exchangeRateSchema, exchangeRateListQuerySchema, type ExchangeRateInput, type ExchangeRateListQuery } from "@clickviajes/shared";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendOk } from "../../utils/api-response.js";
import * as service from "./exchangeRate.service.js";

export const exchangeRateRouter = Router();
const idParams = z.object({ id: z.string().min(1) });

exchangeRateRouter.use(requireAuth);

exchangeRateRouter.get(
  "/",
  validate({ query: exchangeRateListQuerySchema }),
  asyncHandler(async (req, res) => {
    sendOk(res, await service.listRates(req.query as unknown as ExchangeRateListQuery));
  }),
);

// Crear/borrar tasas: solo administradores de la agencia.
exchangeRateRouter.post(
  "/",
  requireRole("AGENCY_ADMIN", "SUPER_ADMIN"),
  validate({ body: exchangeRateSchema }),
  asyncHandler(async (req, res) => {
    sendOk(res, await service.createRate(req.body as ExchangeRateInput), 201);
  }),
);

exchangeRateRouter.delete(
  "/:id",
  requireRole("AGENCY_ADMIN", "SUPER_ADMIN"),
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    await service.deleteRate(req.params.id as string);
    sendOk(res, { ok: true });
  }),
);
