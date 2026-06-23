"use client";

import { useQuery } from "@tanstack/react-query";
import type { AgendaEvent } from "@clickviajes/shared";
import { apiFetch } from "@/lib/api";

export function useAgenda(from: string, to: string) {
  return useQuery({
    queryKey: ["agenda", from, to],
    queryFn: () => apiFetch<AgendaEvent[]>(`/agenda?from=${from}&to=${to}`),
  });
}
