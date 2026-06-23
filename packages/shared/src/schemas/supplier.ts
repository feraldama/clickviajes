import { z } from "zod";
import { SUPPLIER_TYPES } from "../constants";

export const supplierSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(150),
  type: z.enum(SUPPLIER_TYPES),
  email: z.string().email("Email inválido").optional().or(z.literal("")).nullable(),
  phone: z.string().max(40).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});
export type SupplierInput = z.infer<typeof supplierSchema>;

export const supplierListQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["name", "type"]).default("name"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
});
export type SupplierListQuery = z.infer<typeof supplierListQuerySchema>;
