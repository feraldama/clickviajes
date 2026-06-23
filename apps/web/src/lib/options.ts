import {
  CURRENCIES,
  SUPPLIER_TYPES,
  TRIP_STATUSES,
  QUOTE_STATUSES,
  BOOKING_STATUSES,
  PAYMENT_METHODS,
  INSTALLMENT_STATUSES,
  type Currency,
  type SupplierType,
  type TripStatus,
  type QuoteStatus,
  type BookingStatus,
  type PaymentMethod,
  type InstallmentStatus,
} from "@clickviajes/shared";

export const CURRENCY_OPTIONS = CURRENCIES.map((c) => ({ value: c, label: c }));

export const SUPPLIER_TYPE_LABELS: Record<SupplierType, string> = {
  HOTEL: "Hotel",
  TRANSPORT: "Transporte",
  GUIDE: "Guía",
  INSURANCE: "Seguro",
  OTHER: "Otro",
};
export const SUPPLIER_TYPE_OPTIONS = SUPPLIER_TYPES.map((t) => ({ value: t, label: SUPPLIER_TYPE_LABELS[t] }));

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  SCHEDULED: "Programado",
  IN_PROGRESS: "En curso",
  FINISHED: "Finalizado",
  CANCELLED: "Cancelado",
};
export const TRIP_STATUS_OPTIONS = TRIP_STATUSES.map((s) => ({ value: s, label: TRIP_STATUS_LABELS[s] }));

export const TRIP_STATUS_STYLES: Record<TripStatus, string> = {
  SCHEDULED: "bg-secondary/15 text-foreground",
  IN_PROGRESS: "bg-primary/15 text-primary",
  FINISHED: "bg-muted text-muted-fg",
  CANCELLED: "bg-destructive/10 text-destructive",
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
  EXPIRED: "Vencida",
};
export const QUOTE_STATUS_OPTIONS = QUOTE_STATUSES.map((s) => ({ value: s, label: QUOTE_STATUS_LABELS[s] }));
export const QUOTE_STATUS_STYLES: Record<QuoteStatus, string> = {
  DRAFT: "bg-muted text-muted-fg",
  SENT: "bg-primary/15 text-primary",
  ACCEPTED: "bg-success/15 text-success",
  REJECTED: "bg-destructive/10 text-destructive",
  EXPIRED: "bg-secondary/15 text-foreground",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
};
export const BOOKING_STATUS_OPTIONS = BOOKING_STATUSES.map((s) => ({ value: s, label: BOOKING_STATUS_LABELS[s] }));
export const BOOKING_STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING: "bg-secondary/15 text-foreground",
  CONFIRMED: "bg-success/15 text-success",
  CANCELLED: "bg-destructive/10 text-destructive",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
};
export const PAYMENT_METHOD_OPTIONS = PAYMENT_METHODS.map((m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] }));

export const INSTALLMENT_STATUS_LABELS: Record<InstallmentStatus, string> = {
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagada",
  OVERDUE: "Vencida",
};
export const INSTALLMENT_STATUS_STYLES: Record<InstallmentStatus, string> = {
  PENDING: "bg-muted text-muted-fg",
  PARTIAL: "bg-secondary/15 text-foreground",
  PAID: "bg-success/15 text-success",
  OVERDUE: "bg-destructive/10 text-destructive",
};

export type { Currency, SupplierType, TripStatus, QuoteStatus, BookingStatus, PaymentMethod, InstallmentStatus };
