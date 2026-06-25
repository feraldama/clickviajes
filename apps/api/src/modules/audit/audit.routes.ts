import { Router } from "express";
import { auditListQuerySchema, type AuditListQuery, type Paginated } from "@clickviajes/shared";
import { requireAuth, requireRole, requireTenant } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendOk } from "../../utils/api-response.js";
import { prismaBase } from "../../lib/prisma.js";
import { currentTenantId } from "../../lib/tenant-context.js";

export const auditRouter = Router();

// Solo administradores de agencia ven la actividad de su agencia.
auditRouter.use(requireAuth, requireTenant, requireRole("AGENCY_ADMIN"));

auditRouter.get(
  "/",
  validate({ query: auditListQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page, pageSize } = req.query as unknown as AuditListQuery;
    const tenantId = currentTenantId();
    // AuditLog no es un modelo aislado por la extensión: filtramos por tenant a mano.
    const [items, total] = await Promise.all([
      prismaBase.auditLog.findMany({
        where: { tenantId },
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prismaBase.auditLog.count({ where: { tenantId } }),
    ]);
    const result: Paginated<unknown> = { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 };
    sendOk(res, result);
  }),
);
