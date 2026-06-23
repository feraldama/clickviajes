"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Currency, ExchangeRateInput, Paginated } from "@clickviajes/shared";
import { apiFetch } from "@/lib/api";

export interface ExchangeRateRecord {
  id: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: string;
  date: string;
}

export function useExchangeRates() {
  return useQuery({
    queryKey: ["exchange-rates"],
    queryFn: () => apiFetch<Paginated<ExchangeRateRecord>>("/exchange-rates?pageSize=200"),
  });
}

export function useCreateExchangeRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ExchangeRateInput) =>
      apiFetch<ExchangeRateRecord>("/exchange-rates", { method: "POST", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exchange-rates"] }),
  });
}

export function useDeleteExchangeRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/exchange-rates/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exchange-rates"] }),
  });
}
