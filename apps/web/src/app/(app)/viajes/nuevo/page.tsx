"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TripForm, type TripPrefill } from "@/components/TripForm";
import { useCreateTrip } from "@/lib/hooks/useTrips";
import { usePackage } from "@/lib/hooks/usePackages";

function NuevoViajeInner() {
  const create = useCreateTrip();
  const packageId = useSearchParams().get("packageId") ?? undefined;
  const { data: pkg, isLoading } = usePackage(packageId);

  // Si viene de un paquete, precarga destinos, itinerario y datos base.
  const prefill: TripPrefill | undefined = pkg
    ? {
        name: `${pkg.name} — salida`,
        packageId: pkg.id,
        saleCurrency: pkg.currency,
        salePrice: pkg.basePrice ? String(Number(pkg.basePrice)) : undefined,
        destinationIds: pkg.destinations.map((d) => d.destination.id),
        itinerary: pkg.itinerary.map((i) => ({ dayNumber: i.dayNumber, title: i.title, description: i.description })),
      }
    : undefined;

  if (packageId && isLoading) {
    return <div className="py-16 text-center text-muted-fg">Cargando paquete…</div>;
  }

  // `key` fuerza re-montaje cuando el prefill llega tras la carga del paquete.
  return (
    <TripForm
      key={pkg?.id ?? "blank"}
      prefill={prefill}
      submitting={create.isPending}
      onSubmit={async (input) => void (await create.mutateAsync(input))}
    />
  );
}

export default function NuevoViajePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/viajes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-fg hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Volver a viajes
      </Link>
      <PageHeader title="Nuevo viaje" description="Define la salida, sus cupos, costos y precio de venta." />
      <Suspense fallback={<div className="py-16 text-center text-muted-fg">Cargando…</div>}>
        <NuevoViajeInner />
      </Suspense>
    </div>
  );
}
