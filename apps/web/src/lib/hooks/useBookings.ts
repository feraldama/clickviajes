"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BookingInput, BookingStatus, Currency, DocumentType, Paginated } from "@clickviajes/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

export interface PassengerRecord {
  id: string;
  customerId: string | null;
  firstName: string;
  lastName: string;
  docType: DocumentType | null;
  docNumber: string | null;
  birthDate: string | null;
}

export interface BookingRecord {
  id: string;
  customerId: string;
  tripId: string;
  quoteId: string | null;
  status: BookingStatus;
  paxCount: number;
  totalAmount: string;
  currency: Currency;
  commissionRate: string | null;
  commissionAmount: string | null;
  createdAt: string;
  customer: { id: string; firstName: string; lastName: string };
  trip: { id: string; name: string; capacity: number; bookedSeats: number; startDate: string; endDate: string };
  seller: { id: string; fullName: string };
  passengers: PassengerRecord[];
  quote: { id: string } | null;
}

interface ListParams {
  search?: string;
  status?: BookingStatus;
  tripId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

function qs(p: ListParams): string {
  const sp = new URLSearchParams();
  if (p.search) sp.set("search", p.search);
  if (p.status) sp.set("status", p.status);
  if (p.tripId) sp.set("tripId", p.tripId);
  if (p.page) sp.set("page", String(p.page));
  if (p.pageSize) sp.set("pageSize", String(p.pageSize));
  if (p.sortBy) sp.set("sortBy", p.sortBy);
  if (p.sortDir) sp.set("sortDir", p.sortDir);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function useBookings(params: ListParams) {
  return useQuery({
    queryKey: ["bookings", params],
    queryFn: () => apiFetch<Paginated<BookingRecord>>(`/bookings${qs(params)}`),
  });
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: ["bookings", id],
    queryFn: () => apiFetch<BookingRecord>(`/bookings/${id}`),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BookingInput) => apiFetch<BookingRecord>("/bookings", { method: "POST", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Reserva creada");
    },
  });
}

export function useUpdateBooking(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BookingInput) => apiFetch<BookingRecord>(`/bookings/${id}`, { method: "PUT", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Reserva actualizada");
    },
  });
}

export function useChangeBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      apiFetch<BookingRecord>(`/bookings/${id}/status`, { method: "POST", body: { status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Estado actualizado");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo actualizar"),
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/bookings/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Reserva eliminada");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo eliminar"),
  });
}
