import { Router } from "express";
import { loginSchema, registerAgencySchema } from "@clickviajes/shared";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/auth.js";
import { authLimiter } from "../../middlewares/rate-limit.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { loginHandler, logoutHandler, meHandler, refreshHandler, registerAgencyHandler } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/login", authLimiter, validate({ body: loginSchema }), asyncHandler(loginHandler));
authRouter.post("/refresh", authLimiter, asyncHandler(refreshHandler));
authRouter.post("/logout", asyncHandler(logoutHandler));
authRouter.post("/register-agency", authLimiter, validate({ body: registerAgencySchema }), asyncHandler(registerAgencyHandler));
authRouter.get("/me", requireAuth, asyncHandler(meHandler));
