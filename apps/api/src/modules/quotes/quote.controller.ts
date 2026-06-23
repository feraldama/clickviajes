import type { Request, Response } from "express";
import type { QuoteInput, QuoteListQuery } from "@clickviajes/shared";
import type { QuoteStatus } from "@prisma/client";
import { sendOk } from "../../utils/api-response.js";
import * as service from "./quote.service.js";

export async function list(req: Request, res: Response) {
  sendOk(res, await service.listQuotes(req.query as unknown as QuoteListQuery));
}
export async function getOne(req: Request, res: Response) {
  sendOk(res, await service.getQuote(req.params.id as string));
}
export async function create(req: Request, res: Response) {
  sendOk(res, await service.createQuote(req.body as QuoteInput), 201);
}
export async function update(req: Request, res: Response) {
  sendOk(res, await service.updateQuote(req.params.id as string, req.body as QuoteInput));
}
export async function changeStatus(req: Request, res: Response) {
  const { status } = req.body as { status: QuoteStatus };
  sendOk(res, await service.changeQuoteStatus(req.params.id as string, status));
}
export async function remove(req: Request, res: Response) {
  await service.deleteQuote(req.params.id as string);
  sendOk(res, { ok: true });
}
