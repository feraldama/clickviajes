import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import type { AuthResponse, RegisterAgencyInput, UserDTO } from "@clickviajes/shared";
import { prismaBase } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import {
  getTokenExpiry,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt.js";

/** Hash determinista del refresh token para guardarlo en BD (nunca en claro). */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    tenantId: user.tenantId,
  };
}

/** Emite el par de tokens y persiste el refresh hasheado. */
async function issueTokens(user: User): Promise<AuthResponse> {
  const accessToken = signAccessToken({
    sub: user.id,
    tenantId: user.tenantId,
    role: user.role,
  });
  const refreshToken = signRefreshToken({ sub: user.id });
  const expiresAt = getTokenExpiry(refreshToken) ?? new Date(Date.now() + 7 * 864e5);

  await prismaBase.refreshToken.create({
    data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt },
  });

  return { accessToken, refreshToken, user: toUserDTO(user) };
}

/** Login con email + contraseña. El tenant se resuelve desde el usuario. */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const user = await prismaBase.user.findUnique({ where: { email } });
  // Mensaje genérico para no filtrar si el email existe.
  if (!user || !user.isActive) throw AppError.unauthorized("Credenciales inválidas");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw AppError.unauthorized("Credenciales inválidas");

  // Bloquea el acceso si la agencia del usuario está suspendida.
  if (user.tenantId) {
    const tenant = await prismaBase.tenant.findUnique({ where: { id: user.tenantId } });
    if (tenant?.status === "SUSPENDED") {
      throw AppError.forbidden("La agencia está suspendida. Contacta al administrador de la plataforma.");
    }
  }

  return issueTokens(user);
}

/** Registro público de una nueva agencia (onboarding): crea tenant + admin. */
export async function registerAgency(input: RegisterAgencyInput): Promise<void> {
  await prismaBase.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name: input.name, slug: input.slug, baseCurrency: input.baseCurrency, status: "ACTIVE" },
    });
    await tx.user.create({
      data: {
        tenantId: tenant.id,
        email: input.adminEmail,
        passwordHash: bcrypt.hashSync(input.adminPassword, env.BCRYPT_ROUNDS),
        fullName: input.adminName,
        role: "AGENCY_ADMIN",
      },
    });
  });
}

/** Rota el refresh token: revoca el actual y emite uno nuevo. */
export async function refresh(token: string): Promise<AuthResponse> {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw AppError.unauthorized("Sesión inválida");
  }

  const stored = await prismaBase.refreshToken.findFirst({
    where: { userId: payload.sub, tokenHash: hashToken(token), revokedAt: null },
  });
  if (!stored || stored.expiresAt < new Date()) {
    throw AppError.unauthorized("Sesión expirada, inicia sesión nuevamente");
  }

  const user = await prismaBase.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) throw AppError.unauthorized();

  // Rotación: invalida el refresh usado.
  await prismaBase.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return issueTokens(user);
}

/** Cierra sesión revocando el refresh token. */
export async function logout(token: string): Promise<void> {
  await prismaBase.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Devuelve el usuario actual. */
export async function getCurrentUser(userId: string): Promise<UserDTO> {
  const user = await prismaBase.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound("Usuario no encontrado");
  return toUserDTO(user);
}
