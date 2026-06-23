import type { SupplierInput, SupplierListQuery, Paginated } from "@clickviajes/shared";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { currentTenantId } from "../../lib/tenant-context.js";
import { AppError } from "../../utils/app-error.js";

function clean(input: SupplierInput) {
  return {
    name: input.name,
    type: input.type,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

export async function listSuppliers(query: SupplierListQuery): Promise<Paginated<unknown>> {
  const { search, page, pageSize } = query;
  const where: Prisma.SupplierWhereInput = search
    ? { name: { contains: search, mode: "insensitive" } }
    : {};

  const [items, total] = await Promise.all([
    prisma.supplier.findMany({ where, orderBy: { name: "asc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.supplier.count({ where }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 };
}

export async function getSupplier(id: string) {
  const supplier = await prisma.supplier.findFirst({ where: { id } });
  if (!supplier) throw AppError.notFound("Proveedor no encontrado");
  return supplier;
}

export async function createSupplier(input: SupplierInput) {
  const tenantId = currentTenantId();
  if (!tenantId) throw AppError.unauthorized("Sin agencia en contexto");
  return prisma.supplier.create({ data: { tenantId, ...clean(input) } });
}

export async function updateSupplier(id: string, input: SupplierInput) {
  await getSupplier(id);
  return prisma.supplier.update({ where: { id }, data: clean(input) });
}

export async function deleteSupplier(id: string) {
  await getSupplier(id);
  await prisma.supplier.delete({ where: { id } });
}
