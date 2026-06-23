import type { Request, Response } from "express";
import type { SupplierInput, SupplierListQuery } from "@clickviajes/shared";
import { sendOk } from "../../utils/api-response.js";
import * as service from "./supplier.service.js";

export async function list(req: Request, res: Response) {
  sendOk(res, await service.listSuppliers(req.query as unknown as SupplierListQuery));
}
export async function getOne(req: Request, res: Response) {
  sendOk(res, await service.getSupplier(req.params.id as string));
}
export async function create(req: Request, res: Response) {
  sendOk(res, await service.createSupplier(req.body as SupplierInput), 201);
}
export async function update(req: Request, res: Response) {
  sendOk(res, await service.updateSupplier(req.params.id as string, req.body as SupplierInput));
}
export async function remove(req: Request, res: Response) {
  await service.deleteSupplier(req.params.id as string);
  sendOk(res, { ok: true });
}
