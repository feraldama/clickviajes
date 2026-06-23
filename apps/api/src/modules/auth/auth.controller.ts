import type { Request, Response } from "express";
import { sendOk } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import * as authService from "./auth.service.js";

export async function loginHandler(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  const result = await authService.login(email, password);
  sendOk(res, result);
}

export async function refreshHandler(req: Request, res: Response) {
  const { refreshToken } = req.body as { refreshToken: string };
  const result = await authService.refresh(refreshToken);
  sendOk(res, result);
}

export async function logoutHandler(req: Request, res: Response) {
  const { refreshToken } = (req.body ?? {}) as { refreshToken?: string };
  if (refreshToken) await authService.logout(refreshToken);
  sendOk(res, { ok: true });
}

export async function meHandler(req: Request, res: Response) {
  if (!req.auth?.userId) throw AppError.unauthorized();
  const user = await authService.getCurrentUser(req.auth.userId);
  sendOk(res, user);
}
