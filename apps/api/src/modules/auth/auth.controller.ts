import type { CookieOptions, Request, Response } from "express";
import { sendOk } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import { isProduction } from "../../config/env.js";
import * as authService from "./auth.service.js";

const REFRESH_COOKIE = "cv_refresh";

// Cookie httpOnly: no accesible por JS (mitiga XSS). Solo se envía a /auth/*.
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
};

export async function loginHandler(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  const { accessToken, refreshToken, user } = await authService.login(email, password);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  sendOk(res, { accessToken, user });
}

export async function refreshHandler(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!token) throw AppError.unauthorized("Sesión expirada");
  const { accessToken, refreshToken, user } = await authService.refresh(token);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  sendOk(res, { accessToken, user });
}

export async function logoutHandler(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (token) await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE, { path: "/auth" });
  sendOk(res, { ok: true });
}

export async function registerAgencyHandler(req: Request, res: Response) {
  await authService.registerAgency(req.body as Parameters<typeof authService.registerAgency>[0]);
  sendOk(res, { ok: true }, 201);
}

export async function meHandler(req: Request, res: Response) {
  if (!req.auth?.userId) throw AppError.unauthorized();
  const user = await authService.getCurrentUser(req.auth.userId);
  sendOk(res, user);
}
