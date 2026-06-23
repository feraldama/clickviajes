import { z } from "zod";
import { DOCUMENT_TYPES, PERSON_TYPES } from "../constants";

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

/**
 * Crear/editar cliente.
 * - Persona **física**: nombre + apellido; el RUC se autocompleta del CI (módulo 11).
 * - Persona **jurídica**: razón social en `firstName` (apellido opcional); el RUC se
 *   ingresa directo (no se deriva de un CI).
 */
export const customerSchema = z
  .object({
    personType: z.enum(PERSON_TYPES).default("PHYSICAL"),
    firstName: z.string().min(1, "El nombre / razón social es obligatorio").max(150),
    lastName: z.string().max(120).optional().nullable(),
    ci: z.string().max(30).optional().nullable(),
    ruc: z.string().max(40).optional().nullable(),
    email: z.string().email("Email inválido").optional().or(z.literal("")).nullable(),
    phone: z.string().max(40).optional().nullable(),
    address: z.string().max(255).optional().nullable(),
    birthDate: z.coerce.date().optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    documents: z.array(customerDocumentSchema).optional().default([]),
  })
  .superRefine((d, ctx) => {
    if (d.personType === "PHYSICAL" && !d.lastName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lastName"], message: "El apellido es obligatorio" });
    }
    if (d.personType === "JURIDICAL" && !d.ruc?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ruc"], message: "El RUC es obligatorio para personas jurídicas" });
    }
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
