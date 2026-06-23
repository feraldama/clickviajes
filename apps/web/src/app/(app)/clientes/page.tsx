"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Users, AlertTriangle } from "lucide-react";
import { formatFecha } from "@clickviajes/shared";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { useTableState } from "@/lib/hooks/useTableState";
import { useCustomers, useDeleteCustomer, type CustomerRecord } from "@/lib/hooks/useCustomers";

export default function ClientesPage() {
  const t = useTableState("createdAt", "desc");
  const [toDelete, setToDelete] = useState<CustomerRecord | null>(null);
  const { data, isLoading, isError } = useCustomers({
    search: t.debouncedSearch,
    page: t.page,
    pageSize: 20,
    sortBy: t.sortBy,
    sortDir: t.sortDir,
  });
  const del = useDeleteCustomer();

  const columns: Column<CustomerRecord>[] = [
    {
      key: "firstName",
      header: "Nombre",
      render: (c) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{c.firstName}</span>
            {c.personType === "JURIDICAL" && (
              <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-foreground">Jurídica</span>
            )}
          </div>
          {c.birthDate && <div className="text-xs text-muted-fg">Nac. {formatFecha(c.birthDate)}</div>}
        </div>
      ),
    },
    {
      key: "lastName",
      header: "Apellido",
      render: (c) => <span className="font-medium text-foreground">{c.lastName || "—"}</span>,
    },
    {
      key: "ci",
      header: "CI / RUC",
      render: (c) => (
        <div>
          <div className="font-mono text-foreground">{c.ci ?? "—"}</div>
          {c.ruc && <div className="font-mono text-xs text-muted-fg">{c.ruc}</div>}
        </div>
      ),
    },
    {
      key: "email",
      header: "Contacto",
      render: (c) => (
        <div>
          <div className="text-foreground">{c.email ?? "—"}</div>
          {c.phone && <div className="text-xs text-muted-fg">{c.phone}</div>}
        </div>
      ),
    },
    {
      header: "Docs",
      render: (c) => {
        const soon = c.documents.some((d) => d.expiryDate && new Date(d.expiryDate).getTime() <= Date.now() + 30 * 864e5);
        return (
          <span className="inline-flex items-center gap-1">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{c.documents.length}</span>
            {soon && <AlertTriangle className="h-4 w-4 text-amber-500" aria-label="Documento por vencer" />}
          </span>
        );
      },
    },
    {
      header: "Acciones",
      align: "right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/clientes/${c.id}`} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg transition-colors hover:bg-primary/10 hover:text-primary" aria-label={`Editar ${c.firstName}`}>
            <Pencil className="h-4 w-4" />
          </Link>
          <button onClick={() => setToDelete(c)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label={`Eliminar ${c.firstName}`}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Clientes"
        description="Gestiona los clientes de tu agencia, sus documentos y RUC."
        action={
          <Link href="/clientes/nuevo">
            <Button><Plus className="h-4 w-4" /> Nuevo cliente</Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        rows={data?.items}
        getRowKey={(c) => c.id}
        loading={isLoading}
        error={isError}
        emptyIcon={<Users className="h-6 w-6" />}
        emptyTitle={t.debouncedSearch ? "Sin resultados para tu búsqueda" : "Aún no hay clientes"}
        emptyAction={!t.debouncedSearch ? <Link href="/clientes/nuevo"><Button variant="secondary"><Plus className="h-4 w-4" /> Crear el primero</Button></Link> : undefined}
        search={t.search}
        onSearch={t.onSearch}
        searchPlaceholder="Buscar por nombre, CI, RUC o email…"
        sortBy={t.sortBy}
        sortDir={t.sortDir}
        onSort={t.onSort}
        page={data?.page}
        totalPages={data?.totalPages}
        total={data?.total}
        onPage={t.setPage}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar cliente"
        message={`¿Seguro que quieres eliminar a ${toDelete?.firstName} ${toDelete?.lastName}? Esta acción no se puede deshacer.`}
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
