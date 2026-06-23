"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AgencyRole,
  CreateTenantInput,
  CreateUserInput,
  Currency,
  PlanInput,
  TenantStatus,
  UpdateTenantInput,
  UpdateUserInput,
} from "@clickviajes/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

// ───────────── Planes ─────────────
export interface PlanRecord {
  id: string;
  name: string;
  maxUsers: number | null;
  price: string | null;
  currency: Currency;
  _count: { tenants: number };
}

export function usePlans() {
  return useQuery({ queryKey: ["plans"], queryFn: () => apiFetch<PlanRecord[]>("/plans") });
}
export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PlanInput) => apiFetch<PlanRecord>("/plans", { method: "POST", body: input }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["plans"] }); toast.success("Plan creado"); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo guardar"),
  });
}
export function useUpdatePlan(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PlanInput) => apiFetch<PlanRecord>(`/plans/${id}`, { method: "PUT", body: input }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["plans"] }); toast.success("Plan actualizado"); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo guardar"),
  });
}
export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/plans/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["plans"] }); toast.success("Plan eliminado"); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo eliminar (¿está en uso?)"),
  });
}

// ───────────── Agencias (tenants) ─────────────
export interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  baseCurrency: Currency;
  status: TenantStatus;
  maxUsers: number | null;
  planId: string | null;
  plan: { id: string; name: string; maxUsers: number | null } | null;
  _count: { users: number };
  createdAt: string;
}

export function useTenants() {
  return useQuery({ queryKey: ["tenants"], queryFn: () => apiFetch<TenantRecord[]>("/tenants") });
}
export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTenantInput) => apiFetch<TenantRecord>("/tenants", { method: "POST", body: input }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tenants"] }); toast.success("Agencia creada"); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo crear"),
  });
}
export function useUpdateTenant(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTenantInput) => apiFetch<TenantRecord>(`/tenants/${id}`, { method: "PUT", body: input }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tenants"] }); toast.success("Agencia actualizada"); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo guardar"),
  });
}

// ───────────── Usuarios de la agencia ─────────────
export interface UserMgmtRecord {
  id: string;
  email: string;
  fullName: string;
  role: AgencyRole;
  commissionRate: string | null;
  isActive: boolean;
  createdAt: string;
}
export interface UsersResponse {
  items: UserMgmtRecord[];
  used: number;
  max: number | null;
}

export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: () => apiFetch<UsersResponse>("/users") });
}
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => apiFetch<UserMgmtRecord>("/users", { method: "POST", body: input }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("Usuario creado"); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo crear"),
  });
}
export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => apiFetch<UserMgmtRecord>(`/users/${id}`, { method: "PUT", body: input }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("Usuario actualizado"); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo guardar"),
  });
}
