import { Router } from "express";
import { z } from "zod";
import { planSchema, type PlanInput } from "@clickviajes/shared";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendOk } from "../../utils/api-response.js";
import { prismaBase } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";

export const planRouter = Router();
const idParams = z.object({ id: z.string().min(1) });

// Solo el super-admin de plataforma gestiona planes.
planRouter.use(requireAuth, requireRole("SUPER_ADMIN"));

planRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const plans = await prismaBase.plan.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { tenants: true } } },
    });
    sendOk(res, plans);
  }),
);

planRouter.post(
  "/",
  validate({ body: planSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as PlanInput;
    const plan = await prismaBase.plan.create({
      data: { name: input.name, maxUsers: input.maxUsers ?? null, price: input.price ?? null, currency: input.currency },
    });
    sendOk(res, plan, 201);
  }),
);

planRouter.put(
  "/:id",
  validate({ params: idParams, body: planSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as PlanInput;
    const plan = await prismaBase.plan.update({
      where: { id: req.params.id as string },
      data: { name: input.name, maxUsers: input.maxUsers ?? null, price: input.price ?? null, currency: input.currency },
    });
    sendOk(res, plan);
  }),
);

planRouter.delete(
  "/:id",
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const plan = await prismaBase.plan.findUnique({ where: { id } });
    if (!plan) throw AppError.notFound("Plan no encontrado");
    await prismaBase.plan.delete({ where: { id } });
    sendOk(res, { ok: true });
  }),
);
