import { z } from "zod";
import { CURRENCIES, TRIP_STATUSES } from "../constants";
import { money } from "../money";

export const tripItineraryItemSchema = z.object({
  id: z.string().optional(),
  dayNumber: z.coerce.number().int().positive(),
  date: z.coerce.date().optional().nullable(),
  title: z.string().min(1, "El título es obligatorio").max(150),
  description: z.string().max(1000).optional().nullable(),
});
export type TripItineraryItemInput = z.infer<typeof tripItineraryItemSchema>;

export const tripSupplierSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string().min(1, "Selecciona un proveedor"),
  description: z.string().max(255).optional().nullable(),
  cost: money,
  costCurrency: z.enum(CURRENCIES).default("USD"),
});
export type TripSupplierInput = z.infer<typeof tripSupplierSchema>;

export const tripSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio").max(150),
    packageId: z.string().optional().nullable(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    capacity: z.coerce.number().int().positive("El cupo debe ser al menos 1"),
    status: z.enum(TRIP_STATUSES).default("SCHEDULED"),
    salePrice: money,
    saleCurrency: z.enum(CURRENCIES).default("PYG"),
    destinationIds: z.array(z.string()).optional().default([]),
    itinerary: z.array(tripItineraryItemSchema).optional().default([]),
    suppliers: z.array(tripSupplierSchema).optional().default([]),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "La fecha de fin no puede ser anterior a la de inicio",
    path: ["endDate"],
  });
export type TripInput = z.infer<typeof tripSchema>;

export const tripListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(TRIP_STATUSES).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type TripListQuery = z.infer<typeof tripListQuerySchema>;

/** Resumen de margen calculado por el backend (convertido a moneda base). */
export interface TripMargin {
  baseCurrency: string;
  salePriceBase: number | null;
  totalCostBase: number | null;
  margin: number | null;
  marginPct: number | null;
  /** true si faltó alguna tasa de cambio para convertir. */
  incomplete: boolean;
}
