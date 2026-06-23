"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { bookingSchema, DOCUMENT_TYPES, type BookingInput, type Currency, type DocumentType } from "@clickviajes/shared";
import { ApiError } from "@/lib/api";
import { CURRENCY_OPTIONS } from "@/lib/options";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select } from "@/components/ui/Select";
import { CustomerSelect, TripSelect } from "@/components/pickers";
import type { BookingRecord } from "@/lib/hooks/useBookings";
import { useTrips } from "@/lib/hooks/useTrips";

const DOC_LABELS: Record<DocumentType, string> = {
  PASSPORT: "Pasaporte",
  VISA: "Visa",
  ID_CARD: "Cédula / DNI",
  OTHER: "Otro",
};
const DOC_OPTIONS = [{ value: "", label: "— Sin documento —" }, ...DOCUMENT_TYPES.map((t) => ({ value: t, label: DOC_LABELS[t] }))];

interface PaxRow {
  customerId: string | null;
  firstName: string;
  lastName: string;
  docType: string;
  docNumber: string;
}

export interface BookingPrefill {
  quoteId?: string;
  customerId?: string;
  tripId?: string;
  totalAmount?: string;
  currency?: Currency;
}

interface Props {
  initial?: BookingRecord;
  prefill?: BookingPrefill;
  submitting: boolean;
  onSubmit: (input: BookingInput) => Promise<void>;
}

export function BookingForm({ initial, prefill, submitting, onSubmit }: Props) {
  const router = useRouter();
  const quoteId = initial?.quoteId ?? prefill?.quoteId ?? null;

  const [customerId, setCustomerId] = useState(initial?.customerId ?? prefill?.customerId ?? "");
  const [tripId, setTripId] = useState(initial?.tripId ?? prefill?.tripId ?? "");
  const [paxCount, setPaxCount] = useState(initial ? String(initial.paxCount) : "1");
  const [totalAmount, setTotalAmount] = useState(
    initial ? String(Number(initial.totalAmount)) : (prefill?.totalAmount ?? ""),
  );
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? prefill?.currency ?? "PYG");
  const [commissionRate, setCommissionRate] = useState(initial?.commissionRate ? String(Number(initial.commissionRate)) : "");
  const [pax, setPax] = useState<PaxRow[]>(
    initial?.passengers.map((p) => ({
      customerId: p.customerId,
      firstName: p.firstName,
      lastName: p.lastName,
      docType: p.docType ?? "",
      docNumber: p.docNumber ?? "",
    })) ?? [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  // Total sugerido = precio del viaje × pax. No se pisa si el usuario lo editó
  // o si la reserva proviene de una cotización (con su propio total).
  const trips = useTrips({ pageSize: 100 });
  const [totalTouched, setTotalTouched] = useState(!!initial || !!prefill?.totalAmount);

  function recalcTotal(tId: string, pax: string) {
    if (totalTouched) return;
    const trip = trips.data?.items.find((t) => t.id === tId);
    const n = Number(pax);
    if (trip && n > 0) {
      setTotalAmount(String(Number(trip.salePrice) * n));
      setCurrency(trip.saleCurrency);
    }
  }
  function onTripChange(v: string) {
    setTripId(v);
    recalcTotal(v, paxCount);
  }
  function onPaxChange(v: string) {
    setPaxCount(v);
    recalcTotal(tripId, v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");

    const parsed = bookingSchema.safeParse({
      customerId,
      tripId,
      quoteId,
      paxCount: paxCount.trim() === "" ? 0 : Number(paxCount),
      totalAmount: totalAmount.trim() === "" ? 0 : Number(totalAmount),
      currency,
      commissionRate: commissionRate.trim() === "" ? null : Number(commissionRate),
      passengers: pax
        .filter((p) => p.firstName.trim() && p.lastName.trim())
        .map((p) => ({
          customerId: p.customerId || null,
          firstName: p.firstName.trim(),
          lastName: p.lastName.trim(),
          docType: (p.docType || null) as DocumentType | null,
          docNumber: p.docNumber.trim() || null,
          birthDate: null,
        })),
    });
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setErrors({ customerId: fe.customerId?.[0] ?? "", tripId: fe.tripId?.[0] ?? "", paxCount: fe.paxCount?.[0] ?? "" });
      return;
    }
    try {
      await onSubmit(parsed.data);
      router.push("/reservas");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo guardar la reserva.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6" noValidate>
      {formError && <div role="alert" className="rounded-btn border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{formError}</div>}
      {quoteId && <p className="rounded-btn border border-success/30 bg-success/5 px-4 py-2 text-sm text-success">Generada a partir de una cotización aceptada.</p>}

      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg text-foreground">Datos de la reserva</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <CustomerSelect label="Cliente titular" value={customerId} onChange={setCustomerId} error={errors.customerId} />
          <TripSelect value={tripId} onChange={onTripChange} error={errors.tripId} />
          <Input label="Cantidad de pasajeros" value={paxCount} onChange={(e) => onPaxChange(e.target.value)} inputMode="numeric" error={errors.paxCount} />
          <div className="grid grid-cols-2 gap-3">
            <MoneyInput label="Monto total" value={totalAmount} onChange={(v) => { setTotalTouched(true); setTotalAmount(v); }} currency={currency} placeholder="0" />
            <Select label="Moneda" value={currency} onChange={(e) => { setTotalTouched(true); setCurrency(e.target.value as Currency); }} options={CURRENCY_OPTIONS} />
          </div>
          <Input label="Comisión % (opcional)" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} inputMode="decimal" placeholder="Usa la del vendedor" />
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-foreground">Pasajeros</h2>
          <Button type="button" variant="secondary" onClick={() => setPax((p) => [...p, { customerId: null, firstName: "", lastName: "", docType: "", docNumber: "" }])} className="px-3! py-1.5! text-xs">
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>
        <p className="mb-4 text-sm text-muted-fg">El cupo se descuenta por la cantidad indicada arriba; aquí listas a los acompañantes.</p>
        {pax.length === 0 ? (
          <p className="text-sm text-muted-fg">Sin pasajeros listados.</p>
        ) : (
          <div className="space-y-3">
            {pax.map((p, i) => (
              <div key={i} className="rounded-btn border border-line p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Nombre" value={p.firstName} onChange={(e) => setPax((arr) => arr.map((r, idx) => (idx === i ? { ...r, firstName: e.target.value } : r)))} />
                  <Input label="Apellido" value={p.lastName} onChange={(e) => setPax((arr) => arr.map((r, idx) => (idx === i ? { ...r, lastName: e.target.value } : r)))} />
                  <Select label="Documento" value={p.docType} onChange={(e) => setPax((arr) => arr.map((r, idx) => (idx === i ? { ...r, docType: e.target.value } : r)))} options={DOC_OPTIONS} />
                  <Input label="Nº documento" value={p.docNumber} onChange={(e) => setPax((arr) => arr.map((r, idx) => (idx === i ? { ...r, docNumber: e.target.value } : r)))} />
                </div>
                <button type="button" onClick={() => setPax((arr) => arr.filter((_, idx) => idx !== i))} className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm text-destructive hover:underline">
                  <Trash2 className="h-4 w-4" /> Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/reservas")}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? "Guardar cambios" : "Crear reserva"}
        </Button>
      </div>
    </form>
  );
}
