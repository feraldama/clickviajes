"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Currency, QuoteInput, QuoteStatus, Paginated } from "@clickviajes/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

export interface QuoteRecord {
  id: string;
  customerId: string;
  tripId: string | null;
  status: QuoteStatus;
  validUntil: string | null;
  totalAmount: string;
  currency: Currency;
  notes: string | null;
  createdAt: string;
  customer: { id: string; firstName: string; lastName: string };
  trip: { id: string; name: string } | null;
  seller: { id: string; fullName: string };
  booking: { id: string } | null;
}

interface ListParams {
  search?: string;
  status?: QuoteStatus;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

function qs(p: ListParams): string {
  const sp = new URLSearchParams();
  if (p.search) sp.set("search", p.search);
  if (p.status) sp.set("status", p.status);
  if (p.page) sp.set("page", String(p.page));
  if (p.pageSize) sp.set("pageSize", String(p.pageSize));
  if (p.sortBy) sp.set("sortBy", p.sortBy);
  if (p.sortDir) sp.set("sortDir", p.sortDir);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function useQuotes(params: ListParams) {
  return useQuery({
    queryKey: ["quotes", params],
    queryFn: () => apiFetch<Paginated<QuoteRecord>>(`/quotes${qs(params)}`),
  });
}

export function useQuote(id: string | undefined) {
  return useQuery({
    queryKey: ["quotes", id],
    queryFn: () => apiFetch<QuoteRecord>(`/quotes/${id}`),
    enabled: !!id,
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: QuoteInput) => apiFetch<QuoteRecord>("/quotes", { method: "POST", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Cotización creada");
    },
  });
}

export function useUpdateQuote(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: QuoteInput) => apiFetch<QuoteRecord>(`/quotes/${id}`, { method: "PUT", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Cotización actualizada");
    },
  });
}

export function useChangeQuoteStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuoteStatus }) =>
      apiFetch<QuoteRecord>(`/quotes/${id}/status`, { method: "POST", body: { status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Estado actualizado");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo actualizar"),
  });
}

export function useDeleteQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/quotes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Cotización eliminada");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo eliminar"),
  });
}
