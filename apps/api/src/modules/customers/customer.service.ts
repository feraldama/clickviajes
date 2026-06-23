import type { CustomerInput, CustomerListQuery, Paginated } from "@clickviajes/shared";
import { calcularRuc } from "@clickviajes/shared";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { currentTenantId } from "../../lib/tenant-context.js";
import { AppError } from "../../utils/app-error.js";

/** Incluye documentos en las consultas de cliente. */
const withDocuments = { documents: true } satisfies Prisma.CustomerInclude;

/**
 * Si no viene RUC pero sí CI, autocompleta el RUC con el dígito verificador
 * (módulo 11). Si el RUC viene explícito, se respeta (casos jurídicos, etc.).
 */
function resolverRuc(input: CustomerInput): string | null {
  const ruc = input.ruc?.trim();
  if (ruc) return ruc;
  const ci = input.ci?.trim();
  return ci ? calcularRuc(ci) : null;
}

function normalizarEmail(email: CustomerInput["email"]): string | null {
  const e = email?.trim();
  return e ? e : null;
}

export async function listCustomers(query: CustomerListQuery): Promise<Paginated<unknown>> {
  const { search, page, pageSize, sortBy, sortDir } = query;

  const where: Prisma.CustomerWhereInput = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { ci: { contains: search, mode: "insensitive" } },
          { ruc: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const orderBy = { [sortBy]: sortDir } as Prisma.CustomerOrderByWithRelationInput;

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: withDocuments,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 };
}

export async function getCustomer(id: string) {
  const customer = await prisma.customer.findFirst({ where: { id }, include: withDocuments });
  if (!customer) throw AppError.notFound("Cliente no encontrado");
  return customer;
}

export async function createCustomer(input: CustomerInput) {
  // El tenantId de los hijos (documentos) debe setearse explícitamente: la
  // extensión de Prisma solo inyecta el tenant en la operación de nivel superior.
  const tenantId = currentTenantId();
  if (!tenantId) throw AppError.unauthorized("Sin agencia en contexto");

  return prisma.customer.create({
    data: {
      tenantId,
      firstName: input.firstName,
      lastName: input.lastName,
      ci: input.ci?.trim() || null,
      ruc: resolverRuc(input),
      email: normalizarEmail(input.email),
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      birthDate: input.birthDate ?? null,
      notes: input.notes?.trim() || null,
      documents: {
        create: input.documents.map((d) => ({
          tenantId,
          type: d.type,
          number: d.number,
          issueDate: d.issueDate ?? null,
          expiryDate: d.expiryDate ?? null,
          notes: d.notes?.trim() || null,
        })),
      },
    },
    include: withDocuments,
  });
}

export async function updateCustomer(id: string, input: CustomerInput) {
  const tenantId = currentTenantId();
  if (!tenantId) throw AppError.unauthorized("Sin agencia en contexto");

  // Verifica pertenencia al tenant antes de actualizar.
  await getCustomer(id);

  // Estrategia simple para documentos: reemplazar el set completo.
  return prisma.$transaction(async (tx) => {
    await tx.customerDocument.deleteMany({ where: { customerId: id, tenantId } });
    return tx.customer.update({
      where: { id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        ci: input.ci?.trim() || null,
        ruc: resolverRuc(input),
        email: normalizarEmail(input.email),
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        birthDate: input.birthDate ?? null,
        notes: input.notes?.trim() || null,
        documents: {
          create: input.documents.map((d) => ({
            tenantId,
            type: d.type,
            number: d.number,
            issueDate: d.issueDate ?? null,
            expiryDate: d.expiryDate ?? null,
            notes: d.notes?.trim() || null,
          })),
        },
      },
      include: withDocuments,
    });
  });
}

export async function deleteCustomer(id: string) {
  await getCustomer(id); // valida tenant + existencia
  await prisma.customer.delete({ where: { id } });
}
