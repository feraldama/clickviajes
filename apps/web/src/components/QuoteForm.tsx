"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { quoteSchema, fechaInputValue, type Currency, type QuoteInput } from "@clickviajes/shared";
import { ApiError } from "@/lib/api";
import { CURRENCY_OPTIONS } from "@/lib/options";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { CustomerSelect, TripSelect } from "@/components/pickers";
import type { QuoteRecord } from "@/lib/hooks/useQuotes";

interface Props {
  initial?: QuoteRecord;
  submitting: boolean;
  onSubmit: (input: QuoteInput) => Promise<void>;
}

export function QuoteForm({ initial, submitting, onSubmit }: Props) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(initial?.customerId ?? "");
  const [tripId, setTripId] = useState(initial?.tripId ?? "");
  const [totalAmount, setTotalAmount] = useState(initial ? String(Number(initial.totalAmount)) : "");
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? "PYG");
  const [validUntil, setValidUntil] = useState(fechaInputValue(initial?.validUntil));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");

    const parsed = quoteSchema.safeParse({
      customerId,
      tripId: tripId || null,
      totalAmount: totalAmount.trim() === "" ? 0 : Number(totalAmount),
      currency,
      validUntil: validUntil || null,
      notes: notes.trim() || null,
    });
    if (!parsed.success) {
      setErrors({ customerId: parsed.error.flatten().fieldErrors.customerId?.[0] ?? "" });
      return;
    }
    try {
      await onSubmit(parsed.data);
      router.push("/cotizaciones");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo guardar la cotización.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6" noValidate>
      {formError && <div role="alert" className="rounded-btn border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{formError}</div>}
      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <CustomerSelect value={customerId} onChange={setCustomerId} error={errors.customerId} />
          <TripSelect value={tripId} onChange={setTripId} optional label="Viaje (opcional)" />
          <div className="grid grid-cols-2 gap-3">
            <MoneyInput label="Monto total" value={totalAmount} onChange={setTotalAmount} currency={currency} placeholder="0" />
            <Select label="Moneda" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} options={CURRENCY_OPTIONS} />
          </div>
          <Input label="Válida hasta" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </div>
        <div className="mt-4">
          <Textarea label="Notas" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </section>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/cotizaciones")}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? "Guardar cambios" : "Crear cotización"}
        </Button>
      </div>
    </form>
  );
}
