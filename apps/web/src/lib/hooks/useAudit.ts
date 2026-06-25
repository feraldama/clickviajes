"use client";

import { useQuery } from "@tanstack/react-query";
import type { AuditLogRecord, Paginated } from "@clickviajes/shared";
import { apiFetch } from "@/lib/api";

export function useAudit(page: number) {
  return useQuery({
    queryKey: ["audit", page],
    queryFn: () => apiFetch<Paginated<AuditLogRecord>>(`/audit?page=${page}&pageSize=30`),
  });
}
