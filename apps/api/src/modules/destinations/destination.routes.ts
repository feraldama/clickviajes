import { Router } from "express";
import { z } from "zod";
import { destinationSchema, destinationListQuerySchema } from "@clickviajes/shared";
import { requireAuth, requireRole, requireTenant } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as controller from "./destination.controller.js";

export const destinationRouter = Router();

const idParams = z.object({ id: z.string().min(1) });
const adminOnly = requireRole("AGENCY_ADMIN");

destinationRouter.use(requireAuth, requireTenant);

destinationRouter.get("/", validate({ query: destinationListQuerySchema }), asyncHandler(controller.list));
destinationRouter.get("/:id", validate({ params: idParams }), asyncHandler(controller.getOne));
destinationRouter.post("/", adminOnly, validate({ body: destinationSchema }), asyncHandler(controller.create));
destinationRouter.put("/:id", adminOnly, validate({ params: idParams, body: destinationSchema }), asyncHandler(controller.update));
destinationRouter.delete("/:id", adminOnly, validate({ params: idParams }), asyncHandler(controller.remove));
