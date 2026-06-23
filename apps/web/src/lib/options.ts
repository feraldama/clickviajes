import {
  CURRENCIES,
  SUPPLIER_TYPES,
  TRIP_STATUSES,
  type Currency,
  type SupplierType,
  type TripStatus,
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

export type { Currency, SupplierType, TripStatus };
