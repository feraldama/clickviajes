"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { packageSchema, type Currency, type PackageInput } from "@clickviajes/shared";
import { ApiError } from "@/lib/api";
import { CURRENCY_OPTIONS } from "@/lib/options";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { DestinationPicker } from "@/components/DestinationPicker";
import type { PackageRecord } from "@/lib/hooks/usePackages";

interface ItinRow {
  dayNumber: string;
  title: string;
  description: string;
}

interface Props {
  initial?: PackageRecord;
  submitting: boolean;
  onSubmit: (input: PackageInput) => Promise<void>;
}

export function PackageForm({ initial, submitting, onSubmit }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [basePrice, setBasePrice] = useState(initial?.basePrice ? String(Number(initial.basePrice)) : "");
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? "USD");
  const [destinationIds, setDestinationIds] = useState<string[]>(
    initial?.destinations.map((d) => d.destination.id) ?? [],
  );
  const [itinerary, setItinerary] = useState<ItinRow[]>(
    initial?.itinerary.map((i) => ({ dayNumber: String(i.dayNumber), title: i.title, description: i.description ?? "" })) ?? [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  function addDay() {
    setItinerary((it) => [...it, { dayNumber: String(it.length + 1), title: "", description: "" }]);
  }
  function updateDay(i: number, patch: Partial<ItinRow>) {
    setItinerary((it) => it.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function removeDay(i: number) {
    setItinerary((it) => it.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");

    const parsed = packageSchema.safeParse({
      name,
      description: description.trim() || null,
      basePrice: basePrice.trim() === "" ? null : Number(basePrice),
      currency,
      destinationIds,
      itinerary: itinerary
        .filter((r) => r.title.trim())
        .map((r) => ({ dayNumber: Number(r.dayNumber), title: r.title.trim(), description: r.description.trim() || null })),
    });
    if (!parsed.success) {
      setErrors({ name: parsed.error.flatten().fieldErrors.name?.[0] ?? "" });
      return;
    }
    try {
      await onSubmit(parsed.data);
      router.push("/paquetes");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo guardar el paquete.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6" noValidate>
      {formError && <div role="alert" className="rounded-btn border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{formError}</div>}

      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg text-foreground">Datos del paquete</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre *" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Precio base" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} inputMode="decimal" placeholder="0" />
            <Select label="Moneda" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} options={CURRENCY_OPTIONS} />
          </div>
        </div>
        <div className="mt-4">
          <Textarea label="Descripción" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-1 font-display text-lg text-foreground">Destinos incluidos</h2>
        <p className="mb-4 text-sm text-muted-fg">Selecciona los destinos que componen el paquete.</p>
        <DestinationPicker selected={destinationIds} onChange={setDestinationIds} />
      </section>

      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-foreground">Itinerario</h2>
          <Button type="button" variant="secondary" onClick={addDay} className="!px-3 !py-1.5 text-xs">
            <Plus className="h-4 w-4" /> Agregar día
          </Button>
        </div>
        {itinerary.length === 0 ? (
          <p className="text-sm text-muted-fg">Sin itinerario. Agrega los días del paquete.</p>
        ) : (
          <div className="space-y-3">
            {itinerary.map((r, i) => (
              <div key={i} className="rounded-btn border border-line p-4">
                <div className="grid gap-3 sm:grid-cols-[80px_1fr]">
                  <Input label="Día" value={r.dayNumber} onChange={(e) => updateDay(i, { dayNumber: e.target.value })} inputMode="numeric" />
                  <Input label="Título" value={r.title} onChange={(e) => updateDay(i, { title: e.target.value })} />
                </div>
                <div className="mt-3">
                  <Input label="Descripción" value={r.description} onChange={(e) => updateDay(i, { description: e.target.value })} />
                </div>
                <button type="button" onClick={() => removeDay(i)} className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm text-destructive hover:underline">
                  <Trash2 className="h-4 w-4" /> Quitar día
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/paquetes")}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? "Guardar cambios" : "Crear paquete"}
        </Button>
      </div>
    </form>
  );
}
