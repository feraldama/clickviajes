"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccountStatement, InstallmentPlanInput, PaymentInput, ReceiptData } from "@clickviajes/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

export function useAccount(bookingId: string | undefined) {
  return useQuery({
    queryKey: ["account", bookingId],
    queryFn: () => apiFetch<AccountStatement>(`/bookings/${bookingId}/account`),
    enabled: !!bookingId,
  });
}

export function useReceipt(paymentId: string | undefined) {
  return useQuery({
    queryKey: ["receipt", paymentId],
    queryFn: () => apiFetch<ReceiptData>(`/payments/${paymentId}/receipt`),
    enabled: !!paymentId,
  });
}

export function useSetInstallments(bookingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InstallmentPlanInput) =>
      apiFetch<AccountStatement>(`/bookings/${bookingId}/installments`, { method: "PUT", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["account", bookingId] });
      toast.success("Plan de cuotas guardado");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo guardar el plan"),
  });
}

export function useCreatePayment(bookingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PaymentInput) =>
      apiFetch(`/bookings/${bookingId}/payments`, { method: "POST", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["account", bookingId] });
      toast.success("Pago registrado");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo registrar el pago"),
  });
}

export function useDeletePayment(bookingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) => apiFetch(`/payments/${paymentId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["account", bookingId] });
      toast.success("Pago eliminado");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "No se pudo eliminar"),
  });
}
