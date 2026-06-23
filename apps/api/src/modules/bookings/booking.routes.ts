import { Router } from "express";
import { z } from "zod";
import { bookingSchema, bookingListQuerySchema, bookingStatusSchema } from "@clickviajes/shared";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as controller from "./booking.controller.js";

export const bookingRouter = Router();
const idParams = z.object({ id: z.string().min(1) });

bookingRouter.use(requireAuth);
bookingRouter.get("/", validate({ query: bookingListQuerySchema }), asyncHandler(controller.list));
bookingRouter.get("/:id", validate({ params: idParams }), asyncHandler(controller.getOne));
bookingRouter.post("/", validate({ body: bookingSchema }), asyncHandler(controller.create));
bookingRouter.put("/:id", validate({ params: idParams, body: bookingSchema }), asyncHandler(controller.update));
bookingRouter.post("/:id/status", validate({ params: idParams, body: bookingStatusSchema }), asyncHandler(controller.changeStatus));
bookingRouter.delete("/:id", validate({ params: idParams }), asyncHandler(controller.remove));
