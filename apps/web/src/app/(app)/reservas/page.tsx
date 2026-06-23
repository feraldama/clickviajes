"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ClipboardList, Check, Ban, Users, Wallet } from "lucide-react";
import { formatMoney } from "@clickviajes/shared";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { useTableState } from "@/lib/hooks/useTableState";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_OPTIONS, BOOKING_STATUS_STYLES } from "@/lib/options";
import { useBookings, useChangeBookingStatus, useDeleteBooking, type BookingRecord } from "@/lib/hooks/useBookings";

export default function ReservasPage() {
  const t = useTableState("createdAt", "desc");
  const [status, setStatus] = useState("");
  const [toDelete, setToDelete] = useState<BookingRecord | null>(null);
  const { data, isLoading, isError } = useBookings({
    search: t.debouncedSearch,
    status: (status || undefined) as never,
    page: t.page,
    pageSize: 20,
    sortBy: t.sortBy,
    sortDir: t.sortDir,
  });
  const changeStatus = useChangeBookingStatus();
  const del = useDeleteBooking();

  const columns: Column<BookingRecord>[] = [
    { header: "Cliente", render: (b) => <span className="font-medium text-foreground">{b.customer.firstName} {b.customer.lastName}</span> },
    { header: "Viaje", render: (b) => <span className="text-muted-fg">{b.trip.name}</span> },
    { key: "paxCount", header: "Pax", render: (b) => <span className="inline-flex items-center gap-1 font-mono text-foreground"><Users className="h-3.5 w-3.5 text-muted-fg" />{b.paxCount}</span> },
    { key: "totalAmount", header: "Monto", align: "right", render: (b) => <span className="font-mono text-foreground">{formatMoney(b.totalAmount, b.currency)}</span> },
    { header: "Comisión", align: "right", render: (b) => <span className="font-mono text-muted-fg">{b.commissionAmount ? formatMoney(b.commissionAmount, b.currency) : "—"}</span> },
    { key: "status", header: "Estado", render: (b) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${BOOKING_STATUS_STYLES[b.status]}`}>{BOOKING_STATUS_LABELS[b.status]}</span> },
    {
      header: "Acciones",
      align: "right",
      render: (b) => (
        <div className="flex items-center justify-end gap-1">
          {b.status === "PENDING" && (
            <button onClick={() => changeStatus.mutate({ id: b.id, status: "CONFIRMED" })} title="Confirmar" className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-success/10 hover:text-success"><Check className="h-4 w-4" /></button>
          )}
          {b.status !== "CANCELLED" && (
            <button onClick={() => changeStatus.mutate({ id: b.id, status: "CANCELLED" })} title="Cancelar" className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-destructive/10 hover:text-destructive"><Ban className="h-4 w-4" /></button>
          )}
          <Link href={`/reservas/${b.id}/cuenta`} title="Estado de cuenta" className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-primary/10 hover:text-primary" aria-label="Estado de cuenta"><Wallet className="h-4 w-4" /></Link>
          <Link href={`/reservas/${b.id}`} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-primary/10 hover:text-primary" aria-label="Editar"><Pencil className="h-4 w-4" /></Link>
          <button onClick={() => setToDelete(b)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-destructive/10 hover:text-destructive" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Reservas"
        description="Reservas con descuento de cupo, pasajeros y comisión."
        action={<Link href="/reservas/nuevo"><Button><Plus className="h-4 w-4" /> Nueva reserva</Button></Link>}
      />

      <DataTable
        columns={columns}
        rows={data?.items}
        getRowKey={(b) => b.id}
        loading={isLoading}
        error={isError}
        emptyIcon={<ClipboardList className="h-6 w-6" />}
        emptyTitle={t.debouncedSearch || status ? "Sin resultados" : "Aún no hay reservas"}
        emptyAction={!t.debouncedSearch && !status ? <Link href="/reservas/nuevo"><Button variant="secondary"><Plus className="h-4 w-4" /> Crear la primera</Button></Link> : undefined}
        search={t.search}
        onSearch={t.onSearch}
        searchPlaceholder="Buscar por cliente…"
        toolbar={
          <div className="w-48">
            <Select aria-label="Filtrar por estado" value={status} onChange={(e) => { setStatus(e.target.value); t.setPage(1); }} options={[{ value: "", label: "Todos los estados" }, ...BOOKING_STATUS_OPTIONS]} />
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
        title="Eliminar reserva"
        message="¿Eliminar esta reserva? Se liberará el cupo si estaba activa."
        loading={del.isPending}
        onConfirm={async () => { if (toDelete) await del.mutateAsync(toDelete.id); setToDelete(null); }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
