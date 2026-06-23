"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Package as PackageIcon, MapPin } from "lucide-react";
import { formatMoney } from "@clickviajes/shared";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePackages, useDeletePackage, type PackageRecord } from "@/lib/hooks/usePackages";

export default function PaquetesPage() {
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<PackageRecord | null>(null);
  const { data, isLoading } = usePackages({ search, pageSize: 100 });
  const del = useDeletePackage();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Paquetes"
        description="Plantillas reutilizables (destinos + itinerario) para generar salidas."
        action={
          <Link href="/paquetes/nuevo">
            <Button>
              <Plus className="h-4 w-4" /> Nuevo paquete
            </Button>
          </Link>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar paquete…"
          className="w-full rounded-btn border border-line bg-surface py-2.5 pl-10 pr-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {isLoading ? (
        <div className="grid place-items-center rounded-card border border-line bg-surface py-16 shadow-sm">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Cargando" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-card border border-line bg-surface px-6 py-16 text-center shadow-sm">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <PackageIcon className="h-6 w-6" />
          </span>
          <p className="font-medium text-foreground">{search ? "Sin resultados" : "Aún no hay paquetes"}</p>
          {!search && (
            <Link href="/paquetes/nuevo">
              <Button variant="secondary">
                <Plus className="h-4 w-4" /> Crear el primero
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((p) => (
            <article key={p.id} className="flex flex-col rounded-card border border-line bg-surface p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg text-foreground">{p.name}</h3>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-btn bg-primary/10 text-primary">
                  <PackageIcon className="h-5 w-5" />
                </span>
              </div>
              {p.basePrice && (
                <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                  {formatMoney(p.basePrice, p.currency)}
                </p>
              )}
              {p.description && <p className="mt-2 line-clamp-2 text-sm text-muted-fg">{p.description}</p>}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-fg">
                  <MapPin className="h-3 w-3" /> {p.destinations.length} destinos
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-muted-fg">{p.itinerary.length} días</span>
              </div>
              <div className="mt-4 flex justify-end gap-1 border-t border-line/60 pt-3">
                <Link href={`/paquetes/${p.id}`} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-primary/10 hover:text-primary" aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </Link>
                <button onClick={() => setToDelete(p)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-destructive/10 hover:text-destructive" aria-label="Eliminar">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar paquete"
        message={`¿Eliminar "${toDelete?.name}"?`}
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
