import { z } from "zod";
import { CURRENCIES } from "../constants";

export const exchangeRateSchema = z
  .object({
    fromCurrency: z.enum(CURRENCIES),
    toCurrency: z.enum(CURRENCIES),
    rate: z.coerce.number().positive("La tasa debe ser mayor a 0"),
    date: z.coerce.date(),
  })
  .refine((d) => d.fromCurrency !== d.toCurrency, {
    message: "Las monedas de origen y destino deben ser distintas",
    path: ["toCurrency"],
  });
export type ExchangeRateInput = z.infer<typeof exchangeRateSchema>;

export const exchangeRateListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(50),
});
export type ExchangeRateListQuery = z.infer<typeof exchangeRateListQuerySchema>;
