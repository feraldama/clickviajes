import { z } from "zod";
import { CURRENCIES } from "../constants";

export const packageItineraryItemSchema = z.object({
  id: z.string().optional(),
  dayNumber: z.coerce.number().int().positive("El día debe ser positivo"),
  title: z.string().min(1, "El título es obligatorio").max(150),
  description: z.string().max(1000).optional().nullable(),
});
export type PackageItineraryItemInput = z.infer<typeof packageItineraryItemSchema>;

export const packageSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(150),
  description: z.string().max(2000).optional().nullable(),
  basePrice: z.coerce.number().nonnegative().optional().nullable(),
  currency: z.enum(CURRENCIES).default("USD"),
  destinationIds: z.array(z.string()).optional().default([]),
  itinerary: z.array(packageItineraryItemSchema).optional().default([]),
});
export type PackageInput = z.infer<typeof packageSchema>;

export const packageListQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type PackageListQuery = z.infer<typeof packageListQuerySchema>;
