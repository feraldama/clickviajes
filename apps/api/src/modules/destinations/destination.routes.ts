import { Router } from "express";
import { z } from "zod";
import { destinationSchema, destinationListQuerySchema } from "@clickviajes/shared";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as controller from "./destination.controller.js";

export const destinationRouter = Router();

const idParams = z.object({ id: z.string().min(1) });

destinationRouter.use(requireAuth);

destinationRouter.get("/", validate({ query: destinationListQuerySchema }), asyncHandler(controller.list));
destinationRouter.get("/:id", validate({ params: idParams }), asyncHandler(controller.getOne));
destinationRouter.post("/", validate({ body: destinationSchema }), asyncHandler(controller.create));
destinationRouter.put("/:id", validate({ params: idParams, body: destinationSchema }), asyncHandler(controller.update));
destinationRouter.delete("/:id", validate({ params: idParams }), asyncHandler(controller.remove));
