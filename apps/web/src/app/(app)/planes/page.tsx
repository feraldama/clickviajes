"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";
import { planSchema, type Currency, type PlanInput } from "@clickviajes/shared";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { CURRENCY_OPTIONS } from "@/lib/options";
import { formatMoney } from "@clickviajes/shared";
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan, type PlanRecord } from "@/lib/hooks/useSaas";

export default function PlanesPage() {
  const { data, isLoading, isError } = usePlans();
  const create = useCreatePlan();
  const del = useDeletePlan();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<PlanRecord | null>(null);
  const [toDelete, setToDelete] = useState<PlanRecord | null>(null);

  const columns: Column<PlanRecord>[] = [
    { header: "Plan", render: (p) => <span className="font-medium text-foreground">{p.name}</span> },
    { header: "Máx. usuarios", render: (p) => <span className="font-mono text-foreground">{p.maxUsers ?? "Sin límite"}</span> },
    { header: "Precio", render: (p) => <span className="font-mono text-foreground">{p.price ? formatMoney(p.price, p.currency) : "—"}</span> },
    { header: "Agencias", render: (p) => <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{p._count.tenants}</span> },
    {
      header: "Acciones",
      align: "right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => setEditing(p)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-primary/10 hover:text-primary" aria-label="Editar"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setToDelete(p)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-destructive/10 hover:text-destructive" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Planes" description="Planes de suscripción y sus límites (nivel plataforma)." action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nuevo plan</Button>} />

      <DataTable
        columns={columns}
        rows={data}
        getRowKey={(p) => p.id}
        loading={isLoading}
        error={isError}
        emptyIcon={<Layers className="h-6 w-6" />}
        emptyTitle="Aún no hay planes"
        emptyAction={<Button variant="secondary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Crear el primero</Button>}
      />

      <Modal open={creating} title="Nuevo plan" onClose={() => setCreating(false)}>
        <PlanFormFields submitting={create.isPending} onCancel={() => setCreating(false)} onSubmit={async (i) => { await create.mutateAsync(i); setCreating(false); }} />
      </Modal>
      <Modal open={!!editing} title="Editar plan" onClose={() => setEditing(null)}>
        {editing && <EditPlan plan={editing} onDone={() => setEditing(null)} />}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar plan"
        message={`¿Eliminar el plan "${toDelete?.name}"? No se puede si hay agencias usándolo.`}
        loading={del.isPending}
        onConfirm={async () => { if (toDelete) await del.mutateAsync(toDelete.id); setToDelete(null); }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function EditPlan({ plan, onDone }: { plan: PlanRecord; onDone: () => void }) {
  const update = useUpdatePlan(plan.id);
  return <PlanFormFields initial={plan} submitting={update.isPending} onCancel={onDone} onSubmit={async (i) => { await update.mutateAsync(i); onDone(); }} />;
}

function PlanFormFields({ initial, submitting, onSubmit, onCancel }: { initial?: PlanRecord; submitting: boolean; onSubmit: (i: PlanInput) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [maxUsers, setMaxUsers] = useState(initial?.maxUsers ? String(initial.maxUsers) : "");
  const [price, setPrice] = useState(initial?.price ? String(Number(initial.price)) : "");
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? "USD");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = planSchema.safeParse({
      name,
      maxUsers: maxUsers.trim() === "" ? null : Number(maxUsers),
      price: price.trim() === "" ? null : Number(price),
      currency,
    });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Datos inválidos"); return; }
    await onSubmit(parsed.data);
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <p className="rounded-btn bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Input label="Nombre *" value={name} onChange={(e) => setName(e.target.value)} />
      <Input label="Máximo de usuarios (vacío = sin límite)" value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)} inputMode="numeric" placeholder="Sin límite" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Precio" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="0" />
        <Select label="Moneda" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} options={CURRENCY_OPTIONS} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={submitting}>Guardar</Button>
      </div>
    </form>
  );
}
