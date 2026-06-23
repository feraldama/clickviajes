import { Router } from "express";
import { z } from "zod";
import { customerSchema, customerListQuerySchema } from "@clickviajes/shared";
import { requireAuth, requireRole, requireTenant } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as controller from "./customer.controller.js";

export const customerRouter = Router();

const idParams = z.object({ id: z.string().min(1) });
const adminOnly = requireRole("AGENCY_ADMIN");

// Requiere sesión + contexto de agencia; el aislamiento por tenant es automático.
customerRouter.use(requireAuth, requireTenant);

customerRouter.get("/", validate({ query: customerListQuerySchema }), asyncHandler(controller.list));
customerRouter.get("/:id", validate({ params: idParams }), asyncHandler(controller.getOne));
customerRouter.post("/", validate({ body: customerSchema }), asyncHandler(controller.create));
customerRouter.put("/:id", validate({ params: idParams, body: customerSchema }), asyncHandler(controller.update));
customerRouter.delete("/:id", adminOnly, validate({ params: idParams }), asyncHandler(controller.remove));
