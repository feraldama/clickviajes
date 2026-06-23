"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CustomerInput, DocumentType, Paginated } from "@clickviajes/shared";
import { apiFetch } from "@/lib/api";

export interface CustomerDocumentRecord {
  id: string;
  type: DocumentType;
  number: string;
  issueDate: string | null;
  expiryDate: string | null;
  notes: string | null;
}

export interface CustomerRecord {
  id: string;
  firstName: string;
  lastName: string;
  ci: string | null;
  ruc: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  birthDate: string | null;
  notes: string | null;
  documents: CustomerDocumentRecord[];
  createdAt: string;
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

export function useCustomers(params: ListParams) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => apiFetch<Paginated<CustomerRecord>>(`/customers${qs(params)}`),
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => apiFetch<CustomerRecord>(`/customers/${id}`),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInput) =>
      apiFetch<CustomerRecord>("/customers", { method: "POST", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInput) =>
      apiFetch<CustomerRecord>(`/customers/${id}`, { method: "PUT", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/customers/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}
