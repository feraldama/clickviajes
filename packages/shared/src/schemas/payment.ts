import { z } from "zod";
import { CURRENCIES, PAYMENT_METHODS } from "../constants";
import { money, moneyPositive } from "../money";

/** Una cuota del plan de pagos. */
export const installmentInputSchema = z.object({
  dueDate: z.coerce.date(),
  amount: money,
});
export type InstallmentInput = z.infer<typeof installmentInputSchema>;

/** Plan de cuotas completo (reemplaza el existente). */
export const installmentPlanSchema = z.object({
  installments: z.array(installmentInputSchema).min(1, "Agrega al menos una cuota"),
});
export type InstallmentPlanInput = z.infer<typeof installmentPlanSchema>;

/** Registro de un pago contra una reserva (opcionalmente imputado a una cuota). */
export const paymentSchema = z.object({
  amount: moneyPositive,
  method: z.enum(PAYMENT_METHODS),
  installmentId: z.string().optional().nullable(),
  paidAt: z.coerce.date().optional().nullable(),
  receiptNumber: z.string().max(40).optional().nullable(),
  currency: z.enum(CURRENCIES).optional(),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

/** Datos para imprimir el recibo de un pago. */
export interface ReceiptData {
  agencyName: string;
  receiptNumber: string | null;
  paidAt: string;
  amount: string;
  currency: string;
  method: string;
  customerName: string;
  customerRuc: string | null;
  tripName: string;
  bookingId: string;
}

/** Estado de cuenta devuelto por el backend. */
export interface AccountStatement {
  bookingId: string;
  currency: string;
  total: number;
  paid: number;
  balance: number;
  incomplete: boolean; // faltó alguna tasa para convertir pagos
  installments: Array<{
    id: string;
    number: number;
    dueDate: string;
    amount: string;
    currency: string;
    status: string;
    paid: number;
  }>;
  payments: Array<{
    id: string;
    amount: string;
    currency: string;
    method: string;
    paidAt: string;
    receiptNumber: string | null;
    installmentId: string | null;
  }>;
}
