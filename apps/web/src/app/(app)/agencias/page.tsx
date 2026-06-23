"use client";

import { useState } from "react";
import { Plus, Pencil, Building2 } from "lucide-react";
import { createTenantSchema, updateTenantSchema, TENANT_STATUSES, type CreateTenantInput, type Currency, type TenantStatus, type UpdateTenantInput } from "@clickviajes/shared";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { CURRENCY_OPTIONS } from "@/lib/options";
import { usePlans, useTenants, useCreateTenant, useUpdateTenant, type TenantRecord } from "@/lib/hooks/useSaas";

const STATUS_LABEL: Record<TenantStatus, string> = { ACTIVE: "Activa", SUSPENDED: "Suspendida" };
const STATUS_STYLE: Record<TenantStatus, string> = { ACTIVE: "bg-success/15 text-success", SUSPENDED: "bg-destructive/10 text-destructive" };

export default function AgenciasPage() {
  const { data, isLoading, isError } = useTenants();
  const plans = usePlans();
  const create = useCreateTenant();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TenantRecord | null>(null);

  const planOptions = [{ value: "", label: "Sin plan" }, ...(plans.data?.map((p) => ({ value: p.id, label: p.name })) ?? [])];

  const columns: Column<TenantRecord>[] = [
    { header: "Agencia", render: (t) => <div><div className="font-medium text-foreground">{t.name}</div><div className="text-xs text-muted-fg">/{t.slug}</div></div> },
    { header: "Estado", render: (t) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[t.status]}`}>{STATUS_LABEL[t.status]}</span> },
    { header: "Plan", render: (t) => <span className="text-muted-fg">{t.plan?.name ?? "—"}</span> },
    { header: "Usuarios", render: (t) => { const max = t.maxUsers ?? t.plan?.maxUsers ?? null; return <span className="font-mono text-foreground">{t._count.users}{max !== null ? ` / ${max}` : ""}</span>; } },
    { header: "Moneda", render: (t) => <span className="text-muted-fg">{t.baseCurrency}</span> },
    { header: "Acciones", align: "right", render: (t) => <button onClick={() => setEditing(t)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-primary/10 hover:text-primary" aria-label="Editar"><Pencil className="h-4 w-4" /></button> },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Agencias" description="Gestiona las agencias (tenants) de la plataforma." action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nueva agencia</Button>} />

      <DataTable
        columns={columns}
        rows={data}
        getRowKey={(t) => t.id}
        loading={isLoading}
        error={isError}
        emptyIcon={<Building2 className="h-6 w-6" />}
        emptyTitle="Aún no hay agencias"
        emptyAction={<Button variant="secondary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Crear la primera</Button>}
      />

      <Modal open={creating} title="Nueva agencia" onClose={() => setCreating(false)}>
        <CreateTenantForm planOptions={planOptions} submitting={create.isPending} onCancel={() => setCreating(false)} onSubmit={async (i) => { await create.mutateAsync(i); setCreating(false); }} />
      </Modal>
      <Modal open={!!editing} title="Editar agencia" onClose={() => setEditing(null)}>
        {editing && <EditTenantForm tenant={editing} planOptions={planOptions} onDone={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}

interface PlanOpt { value: string; label: string }

function CreateTenantForm({ planOptions, submitting, onSubmit, onCancel }: { planOptions: PlanOpt[]; submitting: boolean; onSubmit: (i: CreateTenantInput) => Promise<void>; onCancel: () => void }) {
  const [f, setF] = useState({ name: "", slug: "", baseCurrency: "PYG" as Currency, planId: "", maxUsers: "", adminName: "", adminEmail: "", adminPassword: "" });
  const [error, setError] = useState("");
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = createTenantSchema.safeParse({
      name: f.name, slug: f.slug, baseCurrency: f.baseCurrency,
      planId: f.planId || null, maxUsers: f.maxUsers.trim() === "" ? null : Number(f.maxUsers),
      adminName: f.adminName, adminEmail: f.adminEmail, adminPassword: f.adminPassword,
    });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Datos inválidos"); return; }
    await onSubmit(parsed.data);
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <p className="rounded-btn bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nombre *" value={f.name} onChange={(e) => set("name", e.target.value)} />
        <Input label="Slug *" value={f.slug} onChange={(e) => set("slug", e.target.value)} placeholder="mi-agencia" />
        <Select label="Moneda base" value={f.baseCurrency} onChange={(e) => set("baseCurrency", e.target.value)} options={CURRENCY_OPTIONS} />
        <Select label="Plan" value={f.planId} onChange={(e) => set("planId", e.target.value)} options={planOptions} />
        <Input label="Máx. usuarios (override)" value={f.maxUsers} onChange={(e) => set("maxUsers", e.target.value)} inputMode="numeric" placeholder="Hereda del plan" />
      </div>
      <p className="border-t border-line pt-3 text-sm font-medium text-foreground">Administrador de la agencia</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nombre *" value={f.adminName} onChange={(e) => set("adminName", e.target.value)} />
        <Input label="Email *" type="email" value={f.adminEmail} onChange={(e) => set("adminEmail", e.target.value)} />
      </div>
      <Input label="Contraseña *" type="password" value={f.adminPassword} onChange={(e) => set("adminPassword", e.target.value)} />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={submitting}>Crear agencia</Button>
      </div>
    </form>
  );
}

function EditTenantForm({ tenant, planOptions, onDone }: { tenant: TenantRecord; planOptions: PlanOpt[]; onDone: () => void }) {
  const update = useUpdateTenant(tenant.id);
  const [f, setF] = useState({ name: tenant.name, status: tenant.status, baseCurrency: tenant.baseCurrency, planId: tenant.planId ?? "", maxUsers: tenant.maxUsers ? String(tenant.maxUsers) : "" });
  const [error, setError] = useState("");
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = updateTenantSchema.safeParse({
      name: f.name, status: f.status, baseCurrency: f.baseCurrency,
      planId: f.planId || null, maxUsers: f.maxUsers.trim() === "" ? null : Number(f.maxUsers),
    } satisfies Record<string, unknown>);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Datos inválidos"); return; }
    await update.mutateAsync(parsed.data as UpdateTenantInput);
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <p className="rounded-btn bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Input label="Nombre" value={f.name} onChange={(e) => set("name", e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Estado" value={f.status} onChange={(e) => set("status", e.target.value)} options={TENANT_STATUSES.map((s) => ({ value: s, label: s === "ACTIVE" ? "Activa" : "Suspendida" }))} />
        <Select label="Moneda base" value={f.baseCurrency} onChange={(e) => set("baseCurrency", e.target.value)} options={CURRENCY_OPTIONS} />
        <Select label="Plan" value={f.planId} onChange={(e) => set("planId", e.target.value)} options={planOptions} />
        <Input label="Máx. usuarios (override)" value={f.maxUsers} onChange={(e) => set("maxUsers", e.target.value)} inputMode="numeric" placeholder="Hereda del plan" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>Cancelar</Button>
        <Button type="submit" loading={update.isPending}>Guardar</Button>
      </div>
    </form>
  );
}
