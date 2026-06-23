import { Router } from "express";
import { z } from "zod";
import { createTenantSchema, updateTenantSchema, type CreateTenantInput, type UpdateTenantInput } from "@clickviajes/shared";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendOk } from "../../utils/api-response.js";
import * as service from "./tenant.service.js";

export const tenantRouter = Router();
const idParams = z.object({ id: z.string().min(1) });

tenantRouter.use(requireAuth, requireRole("SUPER_ADMIN"));

tenantRouter.get(
  "/",
  asyncHandler(async (_req, res) => sendOk(res, await service.listTenants())),
);

tenantRouter.post(
  "/",
  validate({ body: createTenantSchema }),
  asyncHandler(async (req, res) => sendOk(res, await service.createTenant(req.body as CreateTenantInput), 201)),
);

tenantRouter.put(
  "/:id",
  validate({ params: idParams, body: updateTenantSchema }),
  asyncHandler(async (req, res) => sendOk(res, await service.updateTenant(req.params.id as string, req.body as UpdateTenantInput))),
);
