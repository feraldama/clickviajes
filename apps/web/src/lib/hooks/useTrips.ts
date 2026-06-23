"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Currency, TripInput, TripMargin, TripStatus, Paginated } from "@clickviajes/shared";
import { apiFetch } from "@/lib/api";

export interface TripDestinationLink {
  destination: { id: string; name: string; country: string };
}
export interface TripItineraryRecord {
  id: string;
  dayNumber: number;
  date: string | null;
  title: string;
  description: string | null;
}
export interface TripSupplierRecord {
  id: string;
  supplierId: string;
  description: string | null;
  cost: string;
  costCurrency: Currency;
  supplier: { id: string; name: string; type: string };
}
export interface TripRecord {
  id: string;
  name: string;
  packageId: string | null;
  package: { id: string; name: string } | null;
  startDate: string;
  endDate: string;
  capacity: number;
  bookedSeats: number;
  availableSeats: number;
  status: TripStatus;
  salePrice: string;
  saleCurrency: Currency;
  destinations: TripDestinationLink[];
  itinerary: TripItineraryRecord[];
  suppliers: TripSupplierRecord[];
  margin: TripMargin;
}

interface ListParams {
  search?: string;
  status?: TripStatus;
  page?: number;
  pageSize?: number;
}

function qs(p: ListParams): string {
  const sp = new URLSearchParams();
  if (p.search) sp.set("search", p.search);
  if (p.status) sp.set("status", p.status);
  if (p.page) sp.set("page", String(p.page));
  if (p.pageSize) sp.set("pageSize", String(p.pageSize));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function useTrips(params: ListParams) {
  return useQuery({
    queryKey: ["trips", params],
    queryFn: () => apiFetch<Paginated<TripRecord>>(`/trips${qs(params)}`),
  });
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ["trips", id],
    queryFn: () => apiFetch<TripRecord>(`/trips/${id}`),
    enabled: !!id,
  });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TripInput) => apiFetch<TripRecord>("/trips", { method: "POST", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trips"] }),
  });
}

export function useUpdateTrip(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TripInput) => apiFetch<TripRecord>(`/trips/${id}`, { method: "PUT", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trips"] }),
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/trips/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trips"] }),
  });
}
