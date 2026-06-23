import "express";

/** Información de autenticación adjuntada al request por el middleware `attachUser`. */
export interface AuthInfo {
  userId: string;
  tenantId: string | null;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthInfo;
    }
  }
}
