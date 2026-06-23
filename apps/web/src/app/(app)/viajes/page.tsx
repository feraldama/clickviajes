"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Plane, Users } from "lucide-react";
import { formatFecha, formatMoney, type Currency, type TripStatus } from "@clickviajes/shared";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TRIP_STATUS_LABELS, TRIP_STATUS_OPTIONS, TRIP_STATUS_STYLES } from "@/lib/options";
import { MarginValue } from "@/components/MarginValue";
import { Pagination } from "@/components/Pagination";
import { useTrips, useDeleteTrip, type TripRecord } from "@/lib/hooks/useTrips";
import { useDebounce } from "@/lib/hooks/useDebounce";

export default function ViajesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TripStatus | "">("");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<TripRecord | null>(null);
  const { data, isLoading } = useTrips({ search: useDebounce(search), status: status || undefined, page, pageSize: 20 });
  const del = useDeleteTrip();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Viajes / Salidas"
        description="Salidas programadas con cupos, costos por proveedor y margen."
        action={
          <Link href="/viajes/nuevo">
            <Button>
              <Plus className="h-4 w-4" /> Nuevo viaje
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar viaje…"
            className="w-full rounded-btn border border-line bg-surface py-2.5 pl-10 pr-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div className="w-44">
          <Select
            label=""
            aria-label="Filtrar por estado"
            value={status}
            onChange={(e) => { setStatus(e.target.value as TripStatus | ""); setPage(1); }}
            options={[{ value: "", label: "Todos los estados" }, ...TRIP_STATUS_OPTIONS]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center rounded-card border border-line bg-surface py-16 shadow-sm">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Cargando" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-card border border-line bg-surface px-6 py-16 text-center shadow-sm">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Plane className="h-6 w-6" />
          </span>
          <p className="font-medium text-foreground">{search || status ? "Sin resultados" : "Aún no hay viajes"}</p>
          {!search && !status && (
            <Link href="/viajes/nuevo">
              <Button variant="secondary">
                <Plus className="h-4 w-4" /> Crear el primero
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.items.map((t) => (
            <article key={t.id} className="rounded-card border border-line bg-surface p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg text-foreground">{t.name}</h3>
                  <p className="text-sm text-muted-fg">
                    {formatFecha(t.startDate)} — {formatFecha(t.endDate)}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TRIP_STATUS_STYLES[t.status]}`}>
                  {TRIP_STATUS_LABELS[t.status]}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-fg">Cupos</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 font-mono font-semibold text-foreground">
                    <Users className="h-4 w-4 text-muted-fg" />
                    {t.availableSeats}/{t.capacity}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-fg">Precio</p>
                  <p className="mt-0.5 font-mono font-semibold text-foreground">{formatMoney(t.salePrice, t.saleCurrency)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-fg">Margen</p>
                  <MarginValue
                    margin={t.margin.margin}
                    pct={t.margin.marginPct}
                    base={t.margin.baseCurrency as Currency}
                    incomplete={t.margin.incomplete}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-1 border-t border-line/60 pt-3">
                <Link href={`/viajes/${t.id}`} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-primary/10 hover:text-primary" aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </Link>
                <button onClick={() => setToDelete(t)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-destructive/10 hover:text-destructive" aria-label="Eliminar">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />}

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar viaje"
        message={`¿Eliminar "${toDelete?.name}"? Esta acción no se puede deshacer.`}
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
