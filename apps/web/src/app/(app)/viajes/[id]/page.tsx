"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatMoney, type Currency } from "@clickviajes/shared";
import { PageHeader } from "@/components/PageHeader";
import { TripForm } from "@/components/TripForm";
import { MarginValue } from "@/components/MarginValue";
import { useTrip, useUpdateTrip } from "@/lib/hooks/useTrips";

export default function EditarViajePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError } = useTrip(id);
  const update = useUpdateTrip(id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/viajes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-fg hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Volver a viajes
      </Link>
      <PageHeader title="Editar viaje" />

      {isLoading ? (
        <div className="grid place-items-center py-16">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Cargando" />
        </div>
      ) : isError || !data ? (
        <p className="text-destructive">No se pudo cargar el viaje.</p>
      ) : (
        <>
          {/* Resumen de margen (convertido a moneda base) */}
          <div className="mb-6 grid grid-cols-2 gap-4 rounded-card border border-line bg-surface p-5 shadow-sm sm:grid-cols-4">
            <Stat label="Venta (base)" value={data.margin.salePriceBase !== null ? formatMoney(data.margin.salePriceBase, data.margin.baseCurrency as Currency) : "—"} />
            <Stat label="Costo total (base)" value={data.margin.totalCostBase !== null ? formatMoney(data.margin.totalCostBase, data.margin.baseCurrency as Currency) : "—"} />
            <div>
              <p className="text-xs text-muted-fg">Margen</p>
              <MarginValue margin={data.margin.margin} pct={data.margin.marginPct} base={data.margin.baseCurrency as Currency} incomplete={data.margin.incomplete} />
            </div>
            <Stat label="Cupos disponibles" value={`${data.availableSeats}/${data.capacity}`} />
          </div>
          {data.margin.incomplete && (
            <p className="mb-4 rounded-btn border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              Faltan tasas de cambio para convertir todos los montos a la moneda base. Cárgalas en Tipos de cambio.
            </p>
          )}

          <TripForm initial={data} submitting={update.isPending} onSubmit={async (input) => void (await update.mutateAsync(input))} />
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-fg">{label}</p>
      <p className="mt-0.5 font-mono font-semibold text-foreground">{value}</p>
    </div>
  );
}
