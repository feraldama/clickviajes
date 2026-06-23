import type { Request, Response } from "express";
import type { CustomerInput, CustomerListQuery } from "@clickviajes/shared";
import { sendOk } from "../../utils/api-response.js";
import * as service from "./customer.service.js";

export async function list(req: Request, res: Response) {
  const result = await service.listCustomers(req.query as unknown as CustomerListQuery);
  sendOk(res, result);
}

export async function getOne(req: Request, res: Response) {
  const customer = await service.getCustomer((req.params.id as string));
  sendOk(res, customer);
}

export async function create(req: Request, res: Response) {
  const customer = await service.createCustomer(req.body as CustomerInput);
  sendOk(res, customer, 201);
}

export async function update(req: Request, res: Response) {
  const customer = await service.updateCustomer((req.params.id as string), req.body as CustomerInput);
  sendOk(res, customer);
}

export async function remove(req: Request, res: Response) {
  await service.deleteCustomer((req.params.id as string));
  sendOk(res, { ok: true });
}
