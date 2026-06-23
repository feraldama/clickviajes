import type { Request, Response } from "express";
import type { PackageInput, PackageListQuery } from "@clickviajes/shared";
import { sendOk } from "../../utils/api-response.js";
import * as service from "./package.service.js";

export async function list(req: Request, res: Response) {
  sendOk(res, await service.listPackages(req.query as unknown as PackageListQuery));
}
export async function getOne(req: Request, res: Response) {
  sendOk(res, await service.getPackage(req.params.id as string));
}
export async function create(req: Request, res: Response) {
  sendOk(res, await service.createPackage(req.body as PackageInput), 201);
}
export async function update(req: Request, res: Response) {
  sendOk(res, await service.updatePackage(req.params.id as string, req.body as PackageInput));
}
export async function remove(req: Request, res: Response) {
  await service.deletePackage(req.params.id as string);
  sendOk(res, { ok: true });
}
