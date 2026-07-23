import { z } from "zod";
import { BOOKING_STATUSES, CURRENCIES, DOCUMENT_TYPES } from "../constants";
import { money } from "../money";

export const passengerSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().optional().nullable(),
  firstName: z.string().min(1, "Nombre requerido").max(120),
  lastName: z.string().min(1, "Apellido requerido").max(120),
  docType: z.enum(DOCUMENT_TYPES).optional().nullable(),
  docNumber: z.string().max(40).optional().nullable(),
  birthDate: z.coerce.date().optional().nullable(),
});
export type PassengerInput = z.infer<typeof passengerSchema>;

export const bookingSchema = z
  .object({
    customerId: z.string().min(1, "Selecciona el cliente titular"),
    tripId: z.string().min(1, "Selecciona el viaje"),
    quoteId: z.string().optional().nullable(),
    paxCount: z.coerce.number().int().positive("Debe haber al menos 1 pasajero"),
    totalAmount: money,
    currency: z.enum(CURRENCIES).default("PYG"),
    commissionRate: z.coerce.number().min(0).max(100).optional().nullable(),
    passengers: z.array(passengerSchema).optional().default([]),
  })
  .refine((d) => d.passengers.length <= d.paxCount, {
    message: "Hay más pasajeros listados que la cantidad indicada",
    path: ["paxCount"],
  });
export type BookingInput = z.infer<typeof bookingSchema>;

export const bookingStatusSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
});

export const bookingListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(BOOKING_STATUSES).optional(),
  tripId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "totalAmount", "paxCount", "status"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});
export type BookingListQuery = z.infer<typeof bookingListQuerySchema>;
