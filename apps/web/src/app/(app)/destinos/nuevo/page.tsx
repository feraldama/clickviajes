"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DestinationForm } from "@/components/DestinationForm";
import { useCreateDestination } from "@/lib/hooks/useDestinations";

export default function NuevoDestinoPage() {
  const create = useCreateDestination();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/destinos" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-fg hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Volver a destinos
      </Link>
      <PageHeader title="Nuevo destino" />
      <DestinationForm submitting={create.isPending} onSubmit={async (input) => void (await create.mutateAsync(input))} />
    </div>
  );
}
