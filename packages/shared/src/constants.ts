/**
 * Constantes compartidas entre frontend y backend.
 * Reflejan los enums definidos en el esquema Prisma. Mantener sincronizados.
 */

export const CURRENCIES = ["PYG", "USD", "BRL", "ARS"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_LABELS: Record<Currency, string> = {
  PYG: "Guaraní (₲)",
  USD: "Dólar (US$)",
  BRL: "Real (R$)",
  ARS: "Peso argentino ($)",
};

export const USER_ROLES = ["SUPER_ADMIN", "AGENCY_ADMIN", "SELLER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Roles asignables dentro de una agencia (sin SUPER_ADMIN). */
export const AGENCY_ROLES = ["AGENCY_ADMIN", "SELLER"] as const;
export type AgencyRole = (typeof AGENCY_ROLES)[number];

export const TENANT_STATUSES = ["ACTIVE", "SUSPENDED"] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

export const TRIP_STATUSES = ["SCHEDULED", "IN_PROGRESS", "FINISHED", "CANCELLED"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const QUOTE_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const INSTALLMENT_STATUSES = ["PENDING", "PARTIAL", "PAID", "OVERDUE"] as const;
export type InstallmentStatus = (typeof INSTALLMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["CASH", "TRANSFER", "CARD"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const DOCUMENT_TYPES = ["PASSPORT", "VISA", "ID_CARD", "OTHER"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const PERSON_TYPES = ["PHYSICAL", "JURIDICAL"] as const;
export type PersonType = (typeof PERSON_TYPES)[number];

export const SUPPLIER_TYPES = ["HOTEL", "TRANSPORT", "GUIDE", "INSURANCE", "OTHER"] as const;
export type SupplierType = (typeof SUPPLIER_TYPES)[number];
