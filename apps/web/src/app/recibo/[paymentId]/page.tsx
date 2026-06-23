"use client";

import { use } from "react";
import { Printer } from "lucide-react";
import { formatFechaHora, formatMoney, type Currency } from "@clickviajes/shared";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";
import { PAYMENT_METHOD_LABELS } from "@/lib/options";
import { useReceipt } from "@/lib/hooks/usePayments";
import type { PaymentMethod } from "@clickviajes/shared";

export default function ReciboPage({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = use(params);
  const { data, isLoading, isError } = useReceipt(paymentId);

  if (isLoading) {
    return <div className="grid min-h-dvh place-items-center text-muted-fg">Cargando recibo…</div>;
  }
  if (isError || !data) {
    return <div className="grid min-h-dvh place-items-center text-destructive">No se pudo cargar el recibo (¿sesión iniciada?).</div>;
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      {/* Barra de acciones (no se imprime) */}
      <div className="mb-6 flex justify-end print:hidden">
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Imprimir
        </Button>
      </div>

      <div className="rounded-card border border-line bg-surface p-8 shadow-sm print:border-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-line pb-4">
          <Logo />
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-fg">Recibo</p>
            <p className="font-mono text-lg font-semibold text-foreground">{data.receiptNumber ?? "—"}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-fg">{data.agencyName}</p>

        <dl className="mt-6 space-y-3 text-sm">
          <Row label="Fecha" value={formatFechaHora(data.paidAt)} />
          <Row label="Cliente" value={data.customerName} />
          {data.customerRuc && <Row label="RUC" value={data.customerRuc} mono />}
          <Row label="Viaje" value={data.tripName} />
          <Row label="Método de pago" value={PAYMENT_METHOD_LABELS[data.method as PaymentMethod]} />
        </dl>

        <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
          <span className="text-sm font-medium text-muted-fg">Monto pagado</span>
          <span className="font-mono text-2xl font-semibold text-foreground">{formatMoney(data.amount, data.currency as Currency)}</span>
        </div>

        <p className="mt-8 text-center text-xs text-muted-fg">Comprobante de pago · Click Viajes</p>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-fg">{label}</dt>
      <dd className={`text-right text-foreground ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
