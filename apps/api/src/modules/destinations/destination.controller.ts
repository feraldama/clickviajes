import type { Request, Response } from "express";
import type { DestinationInput, DestinationListQuery } from "@clickviajes/shared";
import { sendOk } from "../../utils/api-response.js";
import * as service from "./destination.service.js";

export async function list(req: Request, res: Response) {
  const result = await service.listDestinations(req.query as unknown as DestinationListQuery);
  sendOk(res, result);
}

export async function getOne(req: Request, res: Response) {
  const destination = await service.getDestination((req.params.id as string));
  sendOk(res, destination);
}

export async function create(req: Request, res: Response) {
  const destination = await service.createDestination(req.body as DestinationInput);
  sendOk(res, destination, 201);
}

export async function update(req: Request, res: Response) {
  const destination = await service.updateDestination((req.params.id as string), req.body as DestinationInput);
  sendOk(res, destination);
}

export async function remove(req: Request, res: Response) {
  await service.deleteDestination((req.params.id as string));
  sendOk(res, { ok: true });
}
