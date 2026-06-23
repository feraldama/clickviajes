import { z } from "zod";
import { USER_ROLES } from "../constants";

/** Esquema de login (compartido front/back). */
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Esquema de refresh de token. */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token requerido"),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

/** DTO público del usuario (sin datos sensibles). */
export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  role: (typeof USER_ROLES)[number];
  tenantId: string | null;
}

/** Respuesta de autenticación. */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDTO;
}
