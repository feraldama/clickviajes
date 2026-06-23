import type { Request, Response } from "express";
import type { BookingInput, BookingListQuery } from "@clickviajes/shared";
import type { BookingStatus } from "@prisma/client";
import { sendOk } from "../../utils/api-response.js";
import * as service from "./booking.service.js";

export async function list(req: Request, res: Response) {
  sendOk(res, await service.listBookings(req.query as unknown as BookingListQuery));
}
export async function getOne(req: Request, res: Response) {
  sendOk(res, await service.getBooking(req.params.id as string));
}
export async function create(req: Request, res: Response) {
  sendOk(res, await service.createBooking(req.body as BookingInput), 201);
}
export async function update(req: Request, res: Response) {
  sendOk(res, await service.updateBooking(req.params.id as string, req.body as BookingInput));
}
export async function changeStatus(req: Request, res: Response) {
  const { status } = req.body as { status: BookingStatus };
  sendOk(res, await service.changeBookingStatus(req.params.id as string, status));
}
export async function remove(req: Request, res: Response) {
  await service.deleteBooking(req.params.id as string);
  sendOk(res, { ok: true });
}
