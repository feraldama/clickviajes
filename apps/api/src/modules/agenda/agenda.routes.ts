import { Router } from "express";
import { agendaQuerySchema, type AgendaQuery } from "@clickviajes/shared";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendOk } from "../../utils/api-response.js";
import { getAgenda } from "./agenda.service.js";

export const agendaRouter = Router();

agendaRouter.use(requireAuth);

agendaRouter.get(
  "/",
  validate({ query: agendaQuerySchema }),
  asyncHandler(async (req, res) => {
    const { from, to } = req.query as unknown as AgendaQuery;
    sendOk(res, await getAgenda(from, to));
  }),
);
