"use client";

import { useQuery } from "@tanstack/react-query";
import type { DashboardData } from "@clickviajes/shared";
import { apiFetch } from "@/lib/api";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<DashboardData>("/dashboard"),
  });
}
