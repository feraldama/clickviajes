"use client";

import { useState } from "react";
import { Plus, Trash2, Coins } from "lucide-react";
import { exchangeRateSchema, formatFecha, fechaInputValue, type Currency } from "@clickviajes/shared";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ApiError } from "@/lib/api";
import { CURRENCY_OPTIONS } from "@/lib/options";
import {
  useExchangeRates,
  useCreateExchangeRate,
  useDeleteExchangeRate,
  type ExchangeRateRecord,
} from "@/lib/hooks/useExchangeRates";

export default function TiposCambioPage() {
  const { data, isLoading } = useExchangeRates();
  const create = useCreateExchangeRate();
  const del = useDeleteExchangeRate();
  const [toDelete, setToDelete] = useState<ExchangeRateRecord | null>(null);

  const [from, setFrom] = useState<Currency>("USD");
  const [to, setTo] = useState<Currency>("PYG");
  const [rate, setRate] = useState("");
  const [date, setDate] = useState(fechaInputValue(new Date()));
  const [error, setError] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!date) {
      setError("La fecha es obligatoria");
      return;
    }
    const parsed = exchangeRateSchema.safeParse({
      fromCurrency: from,
      toCurrency: to,
      rate,
      date,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    try {
      await create.mutateAsync(parsed.data);
      setRate("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Tipos de cambio"
        description="Tasas usadas para convertir costos y ventas a la moneda base y calcular el margen."
      />

      <form onSubmit={add} className="mb-6 rounded-card border border-line bg-surface p-5 shadow-sm">
        <div className="grid items-end gap-3 sm:grid-cols-5">
          <Select label="De" value={from} onChange={(e) => setFrom(e.target.value as Currency)} options={CURRENCY_OPTIONS} />
          <Select label="A" value={to} onChange={(e) => setTo(e.target.value as Currency)} options={CURRENCY_OPTIONS} />
          <MoneyInput label="Tasa" value={rate} onChange={setRate} decimals={6} placeholder="7600" />
          <Input label="Fecha" type="date" value={date} onChange={(e) => setDate(e.target.value)} max={fechaInputValue(new Date())} />
          <Button type="submit" loading={create.isPending}>
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <p className="mt-2 text-xs text-muted-fg">Ej. 1 USD = 7600 PYG → De: USD, A: PYG, Tasa: 7600.</p>
      </form>

      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-sm">
        {isLoading ? (
          <div className="grid place-items-center py-16">
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Cargando" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="grid place-items-center gap-3 px-6 py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Coins className="h-6 w-6" />
            </span>
            <p className="font-medium text-foreground">Aún no hay tasas cargadas</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-muted/50 text-xs uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="px-4 py-3 font-semibold">Conversión</th>
                <th className="px-4 py-3 font-semibold">Tasa</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r) => (
                <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {r.fromCurrency} → {r.toCurrency}
                  </td>
                  <td className="px-4 py-3 font-mono text-foreground">{Number(r.rate)}</td>
                  <td className="px-4 py-3 text-muted-fg">{formatFecha(r.date)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setToDelete(r)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-destructive/10 hover:text-destructive" aria-label="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar tasa"
        message={`¿Eliminar la tasa ${toDelete?.fromCurrency} → ${toDelete?.toCurrency}?`}
        loading={del.isPending}
        onConfirm={async () => {
          if (toDelete) await del.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
