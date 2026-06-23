import { z } from "zod";

export const AGENDA_EVENT_TYPES = ["TRIP", "INSTALLMENT", "DOCUMENT"] as const;
export type AgendaEventType = (typeof AGENDA_EVENT_TYPES)[number];

/** Evento unificado de la agenda (salida, vencimiento de cuota o de documento). */
export interface AgendaEvent {
  id: string;
  type: AgendaEventType;
  date: string; // ISO
  title: string;
  subtitle: string;
  status?: string;
  refId: string; // id de la entidad para enlazar
  amount?: string;
  currency?: string;
}

export const agendaQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});
export type AgendaQuery = z.infer<typeof agendaQuerySchema>;
