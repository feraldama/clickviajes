import { z } from "zod";
import { CURRENCIES, QUOTE_STATUSES } from "../constants";
import { money } from "../money";

export const quoteSchema = z.object({
  customerId: z.string().min(1, "Selecciona un cliente"),
  tripId: z.string().optional().nullable(),
  validUntil: z.coerce.date().optional().nullable(),
  totalAmount: money,
  currency: z.enum(CURRENCIES).default("PYG"),
  notes: z.string().max(1000).optional().nullable(),
});
export type QuoteInput = z.infer<typeof quoteSchema>;

export const quoteStatusSchema = z.object({
  status: z.enum(QUOTE_STATUSES),
});

export const quoteListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(QUOTE_STATUSES).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "totalAmount", "status", "validUntil"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});
export type QuoteListQuery = z.infer<typeof quoteListQuerySchema>;
