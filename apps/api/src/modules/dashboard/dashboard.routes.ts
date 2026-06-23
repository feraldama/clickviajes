import { Router } from "express";
import { dashboardQuerySchema, type DashboardQuery } from "@clickviajes/shared";
import { requireAuth, requireTenant } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendOk } from "../../utils/api-response.js";
import { getDashboard } from "./dashboard.service.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth, requireTenant);

dashboardRouter.get(
  "/",
  validate({ query: dashboardQuerySchema }),
  asyncHandler(async (req, res) => {
    const { from, to } = req.query as unknown as DashboardQuery;
    sendOk(res, await getDashboard(from, to));
  }),
);
