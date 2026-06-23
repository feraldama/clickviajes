"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, MapPin } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDestinations, useDeleteDestination, type DestinationRecord } from "@/lib/hooks/useDestinations";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { Pagination } from "@/components/Pagination";

export default function DestinosPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<DestinationRecord | null>(null);

  const { data, isLoading, isError } = useDestinations({ search: useDebounce(search), page, pageSize: 20 });
  const del = useDeleteDestination();

  async function confirmDelete() {
    if (!toDelete) return;
    await del.mutateAsync(toDelete.id);
    setToDelete(null);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Destinos"
        description="Catálogo de destinos turísticos, atracciones y temporadas."
        action={
          <Link href="/destinos/nuevo">
            <Button>
              <Plus className="h-4 w-4" /> Nuevo destino
            </Button>
          </Link>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nombre, país o ciudad…"
          className="w-full rounded-btn border border-line bg-surface py-2.5 pl-10 pr-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {isLoading ? (
        <div className="grid place-items-center rounded-card border border-line bg-surface py-16 shadow-sm">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Cargando" />
        </div>
      ) : isError ? (
        <p className="rounded-card border border-line bg-surface px-6 py-12 text-center text-destructive shadow-sm">
          No se pudieron cargar los destinos.
        </p>
      ) : !data || data.items.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-card border border-line bg-surface px-6 py-16 text-center shadow-sm">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <MapPin className="h-6 w-6" />
          </span>
          <p className="font-medium text-foreground">{search ? "Sin resultados" : "Aún no hay destinos"}</p>
          {!search && (
            <Link href="/destinos/nuevo">
              <Button variant="secondary">
                <Plus className="h-4 w-4" /> Crear el primero
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((d) => (
            <article key={d.id} className="flex flex-col rounded-card border border-line bg-surface p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg text-foreground">{d.name}</h3>
                  <p className="text-sm text-muted-fg">
                    {[d.city, d.country].filter(Boolean).join(", ")}
                  </p>
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-btn bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </span>
              </div>
              {d.description && <p className="mt-3 line-clamp-2 text-sm text-muted-fg">{d.description}</p>}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {d.recommendedSeason && (
                  <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-foreground">{d.recommendedSeason}</span>
                )}
                <span className="rounded-full bg-muted px-2 py-0.5 text-muted-fg">{d.attractions.length} atracciones</span>
              </div>
              <div className="mt-4 flex justify-end gap-1 border-t border-line/60 pt-3">
                <Link
                  href={`/destinos/${d.id}`}
                  className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg transition-colors hover:bg-primary/10 hover:text-primary"
                  aria-label={`Editar ${d.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => setToDelete(d)}
                  className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Eliminar ${d.name}`}
                >
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
        title="Eliminar destino"
        message={`¿Seguro que quieres eliminar "${toDelete?.name}"? Esta acción no se puede deshacer.`}
        loading={del.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
