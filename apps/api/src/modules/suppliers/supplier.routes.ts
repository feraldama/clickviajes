import { Router } from "express";
import { z } from "zod";
import { supplierSchema, supplierListQuerySchema } from "@clickviajes/shared";
import { requireAuth, requireRole, requireTenant } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as controller from "./supplier.controller.js";

export const supplierRouter = Router();
const idParams = z.object({ id: z.string().min(1) });
const adminOnly = requireRole("AGENCY_ADMIN");

supplierRouter.use(requireAuth, requireTenant);
supplierRouter.get("/", validate({ query: supplierListQuerySchema }), asyncHandler(controller.list));
supplierRouter.get("/:id", validate({ params: idParams }), asyncHandler(controller.getOne));
supplierRouter.post("/", adminOnly, validate({ body: supplierSchema }), asyncHandler(controller.create));
supplierRouter.put("/:id", adminOnly, validate({ params: idParams, body: supplierSchema }), asyncHandler(controller.update));
supplierRouter.delete("/:id", adminOnly, validate({ params: idParams }), asyncHandler(controller.remove));
