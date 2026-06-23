"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CustomerForm } from "@/components/CustomerForm";
import { useCreateCustomer } from "@/lib/hooks/useCustomers";

export default function NuevoClientePage() {
  const create = useCreateCustomer();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/clientes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-fg hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Volver a clientes
      </Link>
      <PageHeader title="Nuevo cliente" description="El RUC se calcula automáticamente a partir del CI." />
      <CustomerForm submitting={create.isPending} onSubmit={async (input) => void (await create.mutateAsync(input))} />
    </div>
  );
}
