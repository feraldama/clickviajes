import type { Request, Response } from "express";
import type { TripInput, TripListQuery } from "@clickviajes/shared";
import { sendOk } from "../../utils/api-response.js";
import * as service from "./trip.service.js";

export async function list(req: Request, res: Response) {
  sendOk(res, await service.listTrips(req.query as unknown as TripListQuery));
}
export async function getOne(req: Request, res: Response) {
  sendOk(res, await service.getTrip(req.params.id as string));
}
export async function create(req: Request, res: Response) {
  sendOk(res, await service.createTrip(req.body as TripInput), 201);
}
export async function update(req: Request, res: Response) {
  sendOk(res, await service.updateTrip(req.params.id as string, req.body as TripInput));
}
export async function remove(req: Request, res: Response) {
  await service.deleteTrip(req.params.id as string);
  sendOk(res, { ok: true });
}
