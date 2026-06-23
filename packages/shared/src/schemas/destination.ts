import { z } from "zod";

/** Atracción/actividad asociada a un destino. */
export const attractionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es obligatorio").max(150),
  description: z.string().max(500).optional().nullable(),
});
export type AttractionInput = z.infer<typeof attractionSchema>;

/** Crear/editar destino turístico. */
export const destinationSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(150),
  country: z.string().min(1, "El país es obligatorio").max(100),
  city: z.string().max(100).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  recommendedSeason: z.string().max(120).optional().nullable(),
  photos: z.array(z.string().url("URL inválida")).optional().default([]),
  attractions: z.array(attractionSchema).optional().default([]),
});
export type DestinationInput = z.infer<typeof destinationSchema>;

/** Filtros de listado de destinos. */
export const destinationListQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type DestinationListQuery = z.infer<typeof destinationListQuerySchema>;
