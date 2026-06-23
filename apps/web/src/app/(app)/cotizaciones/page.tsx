"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, FileText, Send, Check, X, ArrowRightCircle } from "lucide-react";
import { formatFecha, formatMoney } from "@clickviajes/shared";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { useTableState } from "@/lib/hooks/useTableState";
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_OPTIONS, QUOTE_STATUS_STYLES } from "@/lib/options";
import { useQuotes, useChangeQuoteStatus, useDeleteQuote, type QuoteRecord } from "@/lib/hooks/useQuotes";

export default function CotizacionesPage() {
  const router = useRouter();
  const t = useTableState("createdAt", "desc");
  const [status, setStatus] = useState("");
  const [toDelete, setToDelete] = useState<QuoteRecord | null>(null);
  const { data, isLoading, isError } = useQuotes({
    search: t.debouncedSearch,
    status: (status || undefined) as never,
    page: t.page,
    pageSize: 20,
    sortBy: t.sortBy,
    sortDir: t.sortDir,
  });
  const changeStatus = useChangeQuoteStatus();
  const del = useDeleteQuote();

  function convertir(q: QuoteRecord) {
    const params = new URLSearchParams({ quoteId: q.id, customerId: q.customerId, total: String(Number(q.totalAmount)), currency: q.currency });
    if (q.tripId) params.set("tripId", q.tripId);
    router.push(`/reservas/nuevo?${params.toString()}`);
  }

  const columns: Column<QuoteRecord>[] = [
    { header: "Cliente", render: (q) => <span className="font-medium text-foreground">{q.customer.firstName} {q.customer.lastName}</span> },
    { header: "Viaje", render: (q) => <span className="text-muted-fg">{q.trip?.name ?? "—"}</span> },
    { key: "totalAmount", header: "Monto", align: "right", render: (q) => <span className="font-mono text-foreground">{formatMoney(q.totalAmount, q.currency)}</span> },
    { key: "validUntil", header: "Validez", render: (q) => <span className="text-muted-fg">{q.validUntil ? formatFecha(q.validUntil) : "—"}</span> },
    { key: "status", header: "Estado", render: (q) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${QUOTE_STATUS_STYLES[q.status]}`}>{QUOTE_STATUS_LABELS[q.status]}</span> },
    {
      header: "Acciones",
      align: "right",
      render: (q) => (
        <div className="flex items-center justify-end gap-1">
          {q.status === "DRAFT" && (
            <button onClick={() => changeStatus.mutate({ id: q.id, status: "SENT" })} title="Marcar enviada" className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-primary/10 hover:text-primary"><Send className="h-4 w-4" /></button>
          )}
          {(q.status === "SENT" || q.status === "DRAFT") && (
            <>
              <button onClick={() => changeStatus.mutate({ id: q.id, status: "ACCEPTED" })} title="Aceptar" className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-success/10 hover:text-success"><Check className="h-4 w-4" /></button>
              <button onClick={() => changeStatus.mutate({ id: q.id, status: "REJECTED" })} title="Rechazar" className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-destructive/10 hover:text-destructive"><X className="h-4 w-4" /></button>
            </>
          )}
          {q.status === "ACCEPTED" && !q.booking && (
            <button onClick={() => convertir(q)} title="Convertir en reserva" className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-accent/10 hover:text-accent"><ArrowRightCircle className="h-4 w-4" /></button>
          )}
          {q.booking && <span className="mr-1 text-xs text-success">Reservada</span>}
          <Link href={`/cotizaciones/${q.id}`} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-primary/10 hover:text-primary" aria-label="Editar"><Pencil className="h-4 w-4" /></Link>
          <button onClick={() => setToDelete(q)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-destructive/10 hover:text-destructive" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Cotizaciones"
        description="Genera cotizaciones y conviértelas en reservas al aceptarse."
        action={<Link href="/cotizaciones/nuevo"><Button><Plus className="h-4 w-4" /> Nueva cotización</Button></Link>}
      />

      <DataTable
        columns={columns}
        rows={data?.items}
        getRowKey={(q) => q.id}
        loading={isLoading}
        error={isError}
        emptyIcon={<FileText className="h-6 w-6" />}
        emptyTitle={t.debouncedSearch || status ? "Sin resultados" : "Aún no hay cotizaciones"}
        emptyAction={!t.debouncedSearch && !status ? <Link href="/cotizaciones/nuevo"><Button variant="secondary"><Plus className="h-4 w-4" /> Crear la primera</Button></Link> : undefined}
        search={t.search}
        onSearch={t.onSearch}
        searchPlaceholder="Buscar por cliente…"
        toolbar={
          <div className="w-48">
            <Select aria-label="Filtrar por estado" value={status} onChange={(e) => { setStatus(e.target.value); t.setPage(1); }} options={[{ value: "", label: "Todos los estados" }, ...QUOTE_STATUS_OPTIONS]} />
          </div>
        }
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
        title="Eliminar cotización"
        message="¿Eliminar esta cotización? Esta acción no se puede deshacer."
        loading={del.isPending}
        onConfirm={async () => { if (toDelete) await del.mutateAsync(toDelete.id); setToDelete(null); }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
