import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AccessPayload {
  sub: string;
  tenantId: string | null;
  role: string;
}

export interface RefreshPayload {
  sub: string;
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: RefreshPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
}

/** Devuelve la fecha de expiración (exp) codificada en un token, o null. */
export function getTokenExpiry(token: string): Date | null {
  const decoded = jwt.decode(token);
  if (decoded && typeof decoded === "object" && typeof decoded.exp === "number") {
    return new Date(decoded.exp * 1000);
  }
  return null;
}
