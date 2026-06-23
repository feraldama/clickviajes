"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PackageForm } from "@/components/PackageForm";
import { useCreatePackage } from "@/lib/hooks/usePackages";

export default function NuevoPaquetePage() {
  const create = useCreatePackage();
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/paquetes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-fg hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Volver a paquetes
      </Link>
      <PageHeader title="Nuevo paquete" />
      <PackageForm submitting={create.isPending} onSubmit={async (input) => void (await create.mutateAsync(input))} />
    </div>
  );
}
