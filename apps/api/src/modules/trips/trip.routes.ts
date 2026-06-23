import { Router } from "express";
import { z } from "zod";
import { tripSchema, tripListQuerySchema } from "@clickviajes/shared";
import { requireAuth, requireRole, requireTenant } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as controller from "./trip.controller.js";

export const tripRouter = Router();
const idParams = z.object({ id: z.string().min(1) });
const adminOnly = requireRole("AGENCY_ADMIN");

tripRouter.use(requireAuth, requireTenant);
tripRouter.get("/", validate({ query: tripListQuerySchema }), asyncHandler(controller.list));
tripRouter.get("/:id", validate({ params: idParams }), asyncHandler(controller.getOne));
tripRouter.post("/", adminOnly, validate({ body: tripSchema }), asyncHandler(controller.create));
tripRouter.put("/:id", adminOnly, validate({ params: idParams, body: tripSchema }), asyncHandler(controller.update));
tripRouter.delete("/:id", adminOnly, validate({ params: idParams }), asyncHandler(controller.remove));
