"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { QuoteForm } from "@/components/QuoteForm";
import { useCreateQuote } from "@/lib/hooks/useQuotes";

export default function NuevaCotizacionPage() {
  const create = useCreateQuote();
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/cotizaciones" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-fg hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Volver a cotizaciones
      </Link>
      <PageHeader title="Nueva cotización" />
      <QuoteForm submitting={create.isPending} onSubmit={async (input) => void (await create.mutateAsync(input))} />
    </div>
  );
}
