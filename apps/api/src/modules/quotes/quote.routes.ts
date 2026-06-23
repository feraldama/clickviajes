import { Router } from "express";
import { z } from "zod";
import { quoteSchema, quoteListQuerySchema, quoteStatusSchema } from "@clickviajes/shared";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as controller from "./quote.controller.js";

export const quoteRouter = Router();
const idParams = z.object({ id: z.string().min(1) });

quoteRouter.use(requireAuth);
quoteRouter.get("/", validate({ query: quoteListQuerySchema }), asyncHandler(controller.list));
quoteRouter.get("/:id", validate({ params: idParams }), asyncHandler(controller.getOne));
quoteRouter.post("/", validate({ body: quoteSchema }), asyncHandler(controller.create));
quoteRouter.put("/:id", validate({ params: idParams, body: quoteSchema }), asyncHandler(controller.update));
quoteRouter.post("/:id/status", validate({ params: idParams, body: quoteStatusSchema }), asyncHandler(controller.changeStatus));
quoteRouter.delete("/:id", validate({ params: idParams }), asyncHandler(controller.remove));
