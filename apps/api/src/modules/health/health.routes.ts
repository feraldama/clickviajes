import { Router } from "express";
import { prismaBase } from "../../lib/prisma.js";
import { sendOk, sendError } from "../../utils/api-response.js";

export const healthRouter = Router();

/** GET /health — estado del servicio y conectividad con la base de datos. */
healthRouter.get("/", async (_req, res) => {
  try {
    await prismaBase.$queryRaw`SELECT 1`;
    return sendOk(res, {
      service: "clickviajes-api",
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return sendError(res, 503, "DB_UNAVAILABLE", "No hay conexión con la base de datos", String(err));
  }
});
