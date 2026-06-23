"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import {
  tripSchema,
  fechaIsoDesdeInput,
  formatFecha,
  parseFecha,
  type Currency,
  type TripInput,
  type TripStatus,
} from "@clickviajes/shared";
import { ApiError } from "@/lib/api";
import { CURRENCY_OPTIONS, TRIP_STATUS_OPTIONS } from "@/lib/options";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DestinationPicker } from "@/components/DestinationPicker";
import { useSuppliers } from "@/lib/hooks/useSuppliers";
import { usePackages } from "@/lib/hooks/usePackages";
import type { TripRecord } from "@/lib/hooks/useTrips";

interface ItinRow {
  dayNumber: string;
  date: string;
  title: string;
  description: string;
}
interface SupRow {
  supplierId: string;
  description: string;
  cost: string;
  costCurrency: Currency;
}

interface Props {
  initial?: TripRecord;
  submitting: boolean;
  onSubmit: (input: TripInput) => Promise<void>;
}

export function TripForm({ initial, submitting, onSubmit }: Props) {
  const router = useRouter();
  const suppliers = useSuppliers({ pageSize: 100 });
  const packages = usePackages({ pageSize: 100 });

  const [name, setName] = useState(initial?.name ?? "");
  const [packageId, setPackageId] = useState(initial?.packageId ?? "");
  const [startDate, setStartDate] = useState(initial ? formatFecha(initial.startDate) : "");
  const [endDate, setEndDate] = useState(initial ? formatFecha(initial.endDate) : "");
  const [capacity, setCapacity] = useState(initial ? String(initial.capacity) : "");
  const [status, setStatus] = useState<TripStatus>(initial?.status ?? "SCHEDULED");
  const [salePrice, setSalePrice] = useState(initial ? String(Number(initial.salePrice)) : "");
  const [saleCurrency, setSaleCurrency] = useState<Currency>(initial?.saleCurrency ?? "PYG");
  const [destinationIds, setDestinationIds] = useState<string[]>(initial?.destinations.map((d) => d.destination.id) ?? []);
  const [itinerary, setItinerary] = useState<ItinRow[]>(
    initial?.itinerary.map((i) => ({
      dayNumber: String(i.dayNumber),
      date: i.date ? formatFecha(i.date) : "",
      title: i.title,
      description: i.description ?? "",
    })) ?? [],
  );
  const [sups, setSups] = useState<SupRow[]>(
    initial?.suppliers.map((s) => ({
      supplierId: s.supplierId,
      description: s.description ?? "",
      cost: String(Number(s.cost)),
      costCurrency: s.costCurrency,
    })) ?? [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const supplierOptions = [
    { value: "", label: "— Selecciona —" },
    ...(suppliers.data?.items.map((s) => ({ value: s.id, label: s.name })) ?? []),
  ];
  const packageOptions = [
    { value: "", label: "Ninguno (salida independiente)" },
    ...(packages.data?.items.map((p) => ({ value: p.id, label: p.name })) ?? []),
  ];

  function fechaOpcional(v: string, campo: string): string | null {
    if (!v.trim()) return null;
    if (!parseFecha(v)) throw new Error(`Fecha inválida en ${campo} (dd/mm/aaaa)`);
    return fechaIsoDesdeInput(v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");

    let payload: TripInput;
    try {
      const start = fechaOpcional(startDate, "inicio");
      const end = fechaOpcional(endDate, "fin");
      if (!start || !end) throw new Error("Las fechas de inicio y fin son obligatorias");

      const parsed = tripSchema.safeParse({
        name,
        packageId: packageId || null,
        startDate: start,
        endDate: end,
        capacity: Number(capacity),
        status,
        salePrice: salePrice.trim() === "" ? 0 : Number(salePrice),
        saleCurrency,
        destinationIds,
        itinerary: itinerary
          .filter((r) => r.title.trim())
          .map((r) => ({
            dayNumber: Number(r.dayNumber),
            date: fechaOpcional(r.date, "itinerario"),
            title: r.title.trim(),
            description: r.description.trim() || null,
          })),
        suppliers: sups
          .filter((s) => s.supplierId)
          .map((s) => ({
            supplierId: s.supplierId,
            description: s.description.trim() || null,
            cost: s.cost.trim() === "" ? 0 : Number(s.cost),
            costCurrency: s.costCurrency,
          })),
      });
      if (!parsed.success) {
        const fe = parsed.error.flatten().fieldErrors;
        setErrors({ name: fe.name?.[0] ?? "", capacity: fe.capacity?.[0] ?? "", endDate: fe.endDate?.[0] ?? "" });
        return;
      }
      payload = parsed.data;
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Datos inválidos");
      return;
    }

    try {
      await onSubmit(payload);
      router.push("/viajes");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo guardar el viaje.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6" noValidate>
      {formError && <div role="alert" className="rounded-btn border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{formError}</div>}

      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg text-foreground">Datos de la salida</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre *" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
          <Select label="Paquete base" value={packageId} onChange={(e) => setPackageId(e.target.value)} options={packageOptions} />
          <Input label="Inicio *" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="dd/mm/aaaa" inputMode="numeric" />
          <Input label="Fin *" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="dd/mm/aaaa" inputMode="numeric" error={errors.endDate} />
          <Input label="Cupo máximo *" value={capacity} onChange={(e) => setCapacity(e.target.value)} inputMode="numeric" error={errors.capacity} />
          <Select label="Estado" value={status} onChange={(e) => setStatus(e.target.value as TripStatus)} options={TRIP_STATUS_OPTIONS} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Precio de venta" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} inputMode="decimal" placeholder="0" />
            <Select label="Moneda" value={saleCurrency} onChange={(e) => setSaleCurrency(e.target.value as Currency)} options={CURRENCY_OPTIONS} />
          </div>
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-1 font-display text-lg text-foreground">Destinos</h2>
        <p className="mb-4 text-sm text-muted-fg">Destinos que cubre esta salida.</p>
        <DestinationPicker selected={destinationIds} onChange={setDestinationIds} />
      </section>

      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-display text-lg text-foreground">Proveedores y costos</h2>
          <Button type="button" variant="secondary" onClick={() => setSups((s) => [...s, { supplierId: "", description: "", cost: "", costCurrency: "USD" }])} className="!px-3 !py-1.5 text-xs">
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>
        <p className="mb-4 text-sm text-muted-fg">El costo total (convertido a tu moneda base) determina el margen.</p>
        {sups.length === 0 ? (
          <p className="text-sm text-muted-fg">Sin proveedores cargados.</p>
        ) : (
          <div className="space-y-3">
            {sups.map((s, i) => (
              <div key={i} className="rounded-btn border border-line p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select label="Proveedor" value={s.supplierId} onChange={(e) => setSups((arr) => arr.map((r, idx) => (idx === i ? { ...r, supplierId: e.target.value } : r)))} options={supplierOptions} />
                  <Input label="Concepto" value={s.description} onChange={(e) => setSups((arr) => arr.map((r, idx) => (idx === i ? { ...r, description: e.target.value } : r)))} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Costo" value={s.cost} onChange={(e) => setSups((arr) => arr.map((r, idx) => (idx === i ? { ...r, cost: e.target.value } : r)))} inputMode="decimal" />
                    <Select label="Moneda" value={s.costCurrency} onChange={(e) => setSups((arr) => arr.map((r, idx) => (idx === i ? { ...r, costCurrency: e.target.value as Currency } : r)))} options={CURRENCY_OPTIONS} />
                  </div>
                </div>
                <button type="button" onClick={() => setSups((arr) => arr.filter((_, idx) => idx !== i))} className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm text-destructive hover:underline">
                  <Trash2 className="h-4 w-4" /> Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-foreground">Itinerario</h2>
          <Button type="button" variant="secondary" onClick={() => setItinerary((it) => [...it, { dayNumber: String(it.length + 1), date: "", title: "", description: "" }])} className="!px-3 !py-1.5 text-xs">
            <Plus className="h-4 w-4" /> Agregar día
          </Button>
        </div>
        {itinerary.length === 0 ? (
          <p className="text-sm text-muted-fg">Sin itinerario.</p>
        ) : (
          <div className="space-y-3">
            {itinerary.map((r, i) => (
              <div key={i} className="rounded-btn border border-line p-4">
                <div className="grid gap-3 sm:grid-cols-[70px_110px_1fr]">
                  <Input label="Día" value={r.dayNumber} onChange={(e) => setItinerary((arr) => arr.map((x, idx) => (idx === i ? { ...x, dayNumber: e.target.value } : x)))} inputMode="numeric" />
                  <Input label="Fecha" value={r.date} onChange={(e) => setItinerary((arr) => arr.map((x, idx) => (idx === i ? { ...x, date: e.target.value } : x)))} placeholder="dd/mm/aaaa" inputMode="numeric" />
                  <Input label="Título" value={r.title} onChange={(e) => setItinerary((arr) => arr.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))} />
                </div>
                <button type="button" onClick={() => setItinerary((arr) => arr.filter((_, idx) => idx !== i))} className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm text-destructive hover:underline">
                  <Trash2 className="h-4 w-4" /> Quitar día
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/viajes")}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? "Guardar cambios" : "Crear viaje"}
        </Button>
      </div>
    </form>
  );
}
