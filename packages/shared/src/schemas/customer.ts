import { z } from "zod";
import { DOCUMENT_TYPES } from "../constants";

/** Documento de un cliente (pasaporte, visa, cédula…). */
export const customerDocumentSchema = z.object({
  id: z.string().optional(),
  type: z.enum(DOCUMENT_TYPES),
  number: z.string().min(1, "El número es obligatorio"),
  issueDate: z.coerce.date().optional().nullable(),
  expiryDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});
export type CustomerDocumentInput = z.infer<typeof customerDocumentSchema>;

/** Crear/editar cliente. El RUC es opcional: si no se envía y hay CI, el
 *  backend lo autocompleta (módulo 11). */
export const customerSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio").max(120),
  lastName: z.string().min(1, "El apellido es obligatorio").max(120),
  ci: z.string().max(30).optional().nullable(),
  ruc: z.string().max(40).optional().nullable(),
  email: z.string().email("Email inválido").optional().or(z.literal("")).nullable(),
  phone: z.string().max(40).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  birthDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  documents: z.array(customerDocumentSchema).optional().default([]),
});
export type CustomerInput = z.infer<typeof customerSchema>;

/** Filtros de listado de clientes. */
export const customerListQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["lastName", "firstName", "ci", "ruc", "email", "createdAt"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;
