"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Currency, PackageInput, Paginated } from "@clickviajes/shared";
import { apiFetch } from "@/lib/api";

export interface PackageDestinationLink {
  destination: { id: string; name: string; country: string };
}
export interface PackageItineraryRecord {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
}
export interface PackageRecord {
  id: string;
  name: string;
  description: string | null;
  basePrice: string | null;
  currency: Currency;
  destinations: PackageDestinationLink[];
  itinerary: PackageItineraryRecord[];
}

interface ListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

function qs(p: ListParams): string {
  const sp = new URLSearchParams();
  if (p.search) sp.set("search", p.search);
  if (p.page) sp.set("page", String(p.page));
  if (p.pageSize) sp.set("pageSize", String(p.pageSize));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function usePackages(params: ListParams) {
  return useQuery({
    queryKey: ["packages", params],
    queryFn: () => apiFetch<Paginated<PackageRecord>>(`/packages${qs(params)}`),
  });
}

export function usePackage(id: string | undefined) {
  return useQuery({
    queryKey: ["packages", id],
    queryFn: () => apiFetch<PackageRecord>(`/packages/${id}`),
    enabled: !!id,
  });
}

export function useCreatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PackageInput) => apiFetch<PackageRecord>("/packages", { method: "POST", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["packages"] }),
  });
}

export function useUpdatePackage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PackageInput) => apiFetch<PackageRecord>(`/packages/${id}`, { method: "PUT", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["packages"] }),
  });
}

export function useDeletePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/packages/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["packages"] }),
  });
}
