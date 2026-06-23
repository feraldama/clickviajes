import { z } from "zod";

export const dashboardQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

/** KPIs y reportes del dashboard, con montos convertidos a la moneda base. */
export interface DashboardData {
  baseCurrency: string;
  incomplete: boolean; // faltó alguna tasa para convertir
  revenue: number; // pagos recibidos en el período
  receivable: number; // saldo por cobrar de reservas activas
  activeBookings: number;
  customers: number;
  occupancy: { booked: number; capacity: number; pct: number };
  topTrips: Array<{ id: string; name: string; pax: number; bookings: number }>;
  sellers: Array<{ id: string; name: string; sales: number; commission: number; bookings: number }>;
  revenueByMonth: Array<{ month: string; amount: number }>;
}
