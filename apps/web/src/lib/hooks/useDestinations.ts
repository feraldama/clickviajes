"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DestinationInput, Paginated } from "@clickviajes/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

export interface AttractionRecord {
  id: string;
  name: string;
  description: string | null;
}

export interface DestinationRecord {
  id: string;
  name: string;
  country: string;
  city: string | null;
  description: string | null;
  recommendedSeason: string | null;
  photos: string[];
  attractions: AttractionRecord[];
}

interface ListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

function qs(params: ListParams): string {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function useDestinations(params: ListParams) {
  return useQuery({
    queryKey: ["destinations", params],
    queryFn: () => apiFetch<Paginated<DestinationRecord>>(`/destinations${qs(params)}`),
  });
}

export function useDestination(id: string | undefined) {
  return useQuery({
    queryKey: ["destinations", id],
    queryFn: () => apiFetch<DestinationRecord>(`/destinations/${id}`),
    enabled: !!id,
  });
}

export function useCreateDestination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DestinationInput) =>
      apiFetch<DestinationRecord>("/destinations", { method: "POST", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["destinations"] });
      toast.success("Destino creado");
    },
  });
}

export function useUpdateDestination(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DestinationInput) =>
      apiFetch<DestinationRecord>(`/destinations/${id}`, { method: "PUT", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["destinations"] });
      toast.success("Destino actualizado");
    },
  });
}

export function useDeleteDestination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/destinations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["destinations"] });
      toast.success("Destino eliminado");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo eliminar"),
  });
}
