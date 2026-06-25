"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { formatFechaHora, type AuditLogRecord } from "@clickviajes/shared";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { useAudit } from "@/lib/hooks/useAudit";

const ACTION_LABELS: Record<string, string> = {
  "booking.create": "Reserva creada",
  "booking.status": "Estado de reserva",
  "booking.delete": "Reserva eliminada",
  "payment.create": "Pago registrado",
  "payment.delete": "Pago eliminado",
  "rate.create": "Tasa creada",
  "rate.delete": "Tasa eliminada",
  "user.create": "Usuario creado",
  "user.update": "Usuario actualizado",
};

export default function ActividadPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAudit(page);

  const columns: Column<AuditLogRecord>[] = [
    { header: "Fecha", render: (a) => <span className="whitespace-nowrap text-muted-fg">{formatFechaHora(a.createdAt)}</span> },
    { header: "Usuario", render: (a) => <span className="text-foreground">{a.user?.fullName ?? "—"}</span> },
    {
      header: "Acción",
      render: (a) => (
        <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-xs text-foreground">{ACTION_LABELS[a.action] ?? a.action}</span>
      ),
    },
    { header: "Detalle", render: (a) => <span className="text-muted-fg">{a.summary}</span> },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Actividad" description="Registro de acciones sobre reservas, pagos, tasas y usuarios de tu agencia." />

      <DataTable
        columns={columns}
        rows={data?.items}
        getRowKey={(a) => a.id}
        loading={isLoading}
        error={isError}
        emptyIcon={<Activity className="h-6 w-6" />}
        emptyTitle="Sin actividad registrada"
        page={data?.page}
        totalPages={data?.totalPages}
        total={data?.total}
        onPage={setPage}
      />
    </div>
  );
}
