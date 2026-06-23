"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PackageForm } from "@/components/PackageForm";
import { usePackage, useUpdatePackage } from "@/lib/hooks/usePackages";

export default function EditarPaquetePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError } = usePackage(id);
  const update = useUpdatePackage(id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/paquetes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-fg hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Volver a paquetes
      </Link>
      <PageHeader title="Editar paquete" />
      {isLoading ? (
        <div className="grid place-items-center py-16">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Cargando" />
        </div>
      ) : isError || !data ? (
        <p className="text-destructive">No se pudo cargar el paquete.</p>
      ) : (
        <PackageForm initial={data} submitting={update.isPending} onSubmit={async (input) => void (await update.mutateAsync(input))} />
      )}
    </div>
  );
}
