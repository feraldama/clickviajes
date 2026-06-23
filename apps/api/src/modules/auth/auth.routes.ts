import { Router } from "express";
import { loginSchema, refreshSchema } from "@clickviajes/shared";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/auth.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { loginHandler, logoutHandler, meHandler, refreshHandler } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/login", validate({ body: loginSchema }), asyncHandler(loginHandler));
authRouter.post("/refresh", validate({ body: refreshSchema }), asyncHandler(refreshHandler));
authRouter.post("/logout", asyncHandler(logoutHandler));
authRouter.get("/me", requireAuth, asyncHandler(meHandler));
