import { Router } from "express";
import { z } from "zod";
import { installmentPlanSchema, paymentSchema, type InstallmentPlanInput, type PaymentInput } from "@clickviajes/shared";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendOk } from "../../utils/api-response.js";
import * as service from "./payment.service.js";

export const paymentRouter = Router();
const bookingParams = z.object({ id: z.string().min(1) });
const paymentParams = z.object({ paymentId: z.string().min(1) });

paymentRouter.use(requireAuth);

// Estado de cuenta de una reserva
paymentRouter.get(
  "/bookings/:id/account",
  validate({ params: bookingParams }),
  asyncHandler(async (req, res) => {
    sendOk(res, await service.getAccount(req.params.id as string));
  }),
);

// Define/reemplaza el plan de cuotas
paymentRouter.put(
  "/bookings/:id/installments",
  validate({ params: bookingParams, body: installmentPlanSchema }),
  asyncHandler(async (req, res) => {
    sendOk(res, await service.setInstallments(req.params.id as string, req.body as InstallmentPlanInput));
  }),
);

// Registra un pago en la reserva
paymentRouter.post(
  "/bookings/:id/payments",
  validate({ params: bookingParams, body: paymentSchema }),
  asyncHandler(async (req, res) => {
    sendOk(res, await service.createPayment(req.params.id as string, req.body as PaymentInput), 201);
  }),
);

// Elimina un pago
paymentRouter.delete(
  "/payments/:paymentId",
  validate({ params: paymentParams }),
  asyncHandler(async (req, res) => {
    await service.deletePayment(req.params.paymentId as string);
    sendOk(res, { ok: true });
  }),
);
