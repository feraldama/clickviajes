import { Router } from "express";
import { z } from "zod";
import { packageSchema, packageListQuerySchema } from "@clickviajes/shared";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as controller from "./package.controller.js";

export const packageRouter = Router();
const idParams = z.object({ id: z.string().min(1) });

packageRouter.use(requireAuth);
packageRouter.get("/", validate({ query: packageListQuerySchema }), asyncHandler(controller.list));
packageRouter.get("/:id", validate({ params: idParams }), asyncHandler(controller.getOne));
packageRouter.post("/", validate({ body: packageSchema }), asyncHandler(controller.create));
packageRouter.put("/:id", validate({ params: idParams, body: packageSchema }), asyncHandler(controller.update));
packageRouter.delete("/:id", validate({ params: idParams }), asyncHandler(controller.remove));
