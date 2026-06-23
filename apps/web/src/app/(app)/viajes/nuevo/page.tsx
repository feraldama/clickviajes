"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TripForm } from "@/components/TripForm";
import { useCreateTrip } from "@/lib/hooks/useTrips";

export default function NuevoViajePage() {
  const create = useCreateTrip();
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/viajes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-fg hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Volver a viajes
      </Link>
      <PageHeader title="Nuevo viaje" description="Define la salida, sus cupos, costos y precio de venta." />
      <TripForm submitting={create.isPending} onSubmit={async (input) => void (await create.mutateAsync(input))} />
    </div>
  );
}
