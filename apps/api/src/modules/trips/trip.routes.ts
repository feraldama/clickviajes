import { Router } from "express";
import { z } from "zod";
import { tripSchema, tripListQuerySchema } from "@clickviajes/shared";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as controller from "./trip.controller.js";

export const tripRouter = Router();
const idParams = z.object({ id: z.string().min(1) });

tripRouter.use(requireAuth);
tripRouter.get("/", validate({ query: tripListQuerySchema }), asyncHandler(controller.list));
tripRouter.get("/:id", validate({ params: idParams }), asyncHandler(controller.getOne));
tripRouter.post("/", validate({ body: tripSchema }), asyncHandler(controller.create));
tripRouter.put("/:id", validate({ params: idParams, body: tripSchema }), asyncHandler(controller.update));
tripRouter.delete("/:id", validate({ params: idParams }), asyncHandler(controller.remove));
