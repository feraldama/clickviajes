"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Currency } from "@clickviajes/shared";
import { PageHeader } from "@/components/PageHeader";
import { BookingForm, type BookingPrefill } from "@/components/BookingForm";
import { useCreateBooking } from "@/lib/hooks/useBookings";

function NuevaReservaInner() {
  const create = useCreateBooking();
  const sp = useSearchParams();

  // Prefill cuando se llega desde "convertir cotización".
  const prefill: BookingPrefill = {
    quoteId: sp.get("quoteId") ?? undefined,
    customerId: sp.get("customerId") ?? undefined,
    tripId: sp.get("tripId") ?? undefined,
    totalAmount: sp.get("total") ?? undefined,
    currency: (sp.get("currency") as Currency | null) ?? undefined,
  };

  return <BookingForm prefill={prefill} submitting={create.isPending} onSubmit={async (input) => void (await create.mutateAsync(input))} />;
}

export default function NuevaReservaPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/reservas" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-fg hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Volver a reservas
      </Link>
      <PageHeader title="Nueva reserva" description="El cupo del viaje se descuenta automáticamente." />
      <Suspense fallback={<div className="py-16 text-center text-muted-fg">Cargando…</div>}>
        <NuevaReservaInner />
      </Suspense>
    </div>
  );
}
