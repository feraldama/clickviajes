"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupplierInput, SupplierType, Paginated } from "@clickviajes/shared";
import { apiFetch } from "@/lib/api";

export interface SupplierRecord {
  id: string;
  name: string;
  type: SupplierType;
  email: string | null;
  phone: string | null;
  notes: string | null;
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

export function useSuppliers(params: ListParams) {
  return useQuery({
    queryKey: ["suppliers", params],
    queryFn: () => apiFetch<Paginated<SupplierRecord>>(`/suppliers${qs(params)}`),
  });
}

export function useSupplier(id: string | undefined) {
  return useQuery({
    queryKey: ["suppliers", id],
    queryFn: () => apiFetch<SupplierRecord>(`/suppliers/${id}`),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SupplierInput) => apiFetch<SupplierRecord>("/suppliers", { method: "POST", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useUpdateSupplier(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SupplierInput) => apiFetch<SupplierRecord>(`/suppliers/${id}`, { method: "PUT", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/suppliers/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}
