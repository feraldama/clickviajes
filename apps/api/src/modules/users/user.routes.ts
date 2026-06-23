import { Router } from "express";
import { z } from "zod";
import { createUserSchema, updateUserSchema, type CreateUserInput, type UpdateUserInput } from "@clickviajes/shared";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendOk } from "../../utils/api-response.js";
import * as service from "./user.service.js";

export const userRouter = Router();
const idParams = z.object({ id: z.string().min(1) });

// Gestión de usuarios de la agencia: solo administradores de agencia.
userRouter.use(requireAuth, requireRole("AGENCY_ADMIN"));

userRouter.get("/", asyncHandler(async (_req, res) => sendOk(res, await service.listUsers())));

userRouter.post(
  "/",
  validate({ body: createUserSchema }),
  asyncHandler(async (req, res) => sendOk(res, await service.createUser(req.body as CreateUserInput), 201)),
);

userRouter.put(
  "/:id",
  validate({ params: idParams, body: updateUserSchema }),
  asyncHandler(async (req, res) => sendOk(res, await service.updateUser(req.params.id as string, req.body as UpdateUserInput))),
);
