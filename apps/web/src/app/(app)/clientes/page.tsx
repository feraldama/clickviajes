"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { formatFecha } from "@clickviajes/shared";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useCustomers, useDeleteCustomer, type CustomerRecord } from "@/lib/hooks/useCustomers";

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<CustomerRecord | null>(null);

  const { data, isLoading, isError } = useCustomers({ search, page, pageSize: 20 });
  const del = useDeleteCustomer();

  async function confirmDelete() {
    if (!toDelete) return;
    await del.mutateAsync(toDelete.id);
    setToDelete(null);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Clientes"
        description="Gestiona los clientes de tu agencia, sus documentos y RUC."
        action={
          <Link href="/clientes/nuevo">
            <Button>
              <Plus className="h-4 w-4" /> Nuevo cliente
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
          placeholder="Buscar por nombre, CI, RUC o email…"
          className="w-full rounded-btn border border-line bg-surface py-2.5 pl-10 pr-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-sm">
        {isLoading ? (
          <div className="grid place-items-center py-16">
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Cargando" />
          </div>
        ) : isError ? (
          <p className="px-6 py-12 text-center text-destructive">No se pudieron cargar los clientes.</p>
        ) : !data || data.items.length === 0 ? (
          <div className="grid place-items-center gap-3 px-6 py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </span>
            <p className="font-medium text-foreground">
              {search ? "Sin resultados para tu búsqueda" : "Aún no hay clientes"}
            </p>
            {!search && (
              <Link href="/clientes/nuevo">
                <Button variant="secondary">
                  <Plus className="h-4 w-4" /> Crear el primero
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-muted/50 text-xs uppercase tracking-wide text-muted-fg">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">CI / RUC</th>
                  <th className="px-4 py-3 font-semibold">Contacto</th>
                  <th className="px-4 py-3 font-semibold">Docs</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c.id} className="border-b border-line/60 last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {c.firstName} {c.lastName}
                      </div>
                      {c.birthDate && <div className="text-xs text-muted-fg">Nac. {formatFecha(c.birthDate)}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-foreground">{c.ci ?? "—"}</div>
                      {c.ruc && <div className="font-mono text-xs text-muted-fg">{c.ruc}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-foreground">{c.email ?? "—"}</div>
                      {c.phone && <div className="text-xs text-muted-fg">{c.phone}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {c.documents.length}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/clientes/${c.id}`}
                          className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg transition-colors hover:bg-primary/10 hover:text-primary"
                          aria-label={`Editar ${c.firstName}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setToDelete(c)}
                          className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Eliminar ${c.firstName}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-fg">
          <span>
            Página {data.page} de {data.totalPages} · {data.total} clientes
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button variant="ghost" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar cliente"
        message={`¿Seguro que quieres eliminar a ${toDelete?.firstName} ${toDelete?.lastName}? Esta acción no se puede deshacer.`}
        loading={del.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
