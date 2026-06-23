"use client";

import { useState } from "react";
import { Plus, Pencil, UserCog } from "lucide-react";
import { createUserSchema, updateUserSchema, AGENCY_ROLES, type AgencyRole, type CreateUserInput, type UpdateUserInput } from "@clickviajes/shared";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { useUsers, useCreateUser, useUpdateUser, type UserMgmtRecord } from "@/lib/hooks/useSaas";

const ROLE_LABEL: Record<AgencyRole, string> = { AGENCY_ADMIN: "Administrador", SELLER: "Vendedor" };
const ROLE_OPTIONS = AGENCY_ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }));

export default function UsuariosPage() {
  const { data, isLoading, isError } = useUsers();
  const create = useCreateUser();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<UserMgmtRecord | null>(null);

  const atLimit = data?.max != null && data.used >= data.max;

  const columns: Column<UserMgmtRecord>[] = [
    { header: "Nombre", render: (u) => <span className="font-medium text-foreground">{u.fullName}</span> },
    { header: "Email", render: (u) => <span className="text-muted-fg">{u.email}</span> },
    { header: "Rol", render: (u) => <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-xs text-foreground">{ROLE_LABEL[u.role]}</span> },
    { header: "Comisión", render: (u) => <span className="font-mono text-muted-fg">{u.commissionRate ? `${Number(u.commissionRate)}%` : "—"}</span> },
    { header: "Estado", render: (u) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.isActive ? "bg-success/15 text-success" : "bg-muted text-muted-fg"}`}>{u.isActive ? "Activo" : "Inactivo"}</span> },
    { header: "Acciones", align: "right", render: (u) => <button onClick={() => setEditing(u)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-primary/10 hover:text-primary" aria-label="Editar"><Pencil className="h-4 w-4" /></button> },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Usuarios"
        description="Administra los usuarios de tu agencia (administradores y vendedores)."
        action={<Button onClick={() => setCreating(true)} disabled={atLimit}><Plus className="h-4 w-4" /> Nuevo usuario</Button>}
      />

      {data && (
        <p className="mb-4 text-sm text-muted-fg">
          Usuarios activos: <span className="font-mono font-medium text-foreground">{data.used}{data.max != null ? ` / ${data.max}` : ""}</span>
          {atLimit && <span className="ml-2 text-destructive">· Alcanzaste el límite de tu plan</span>}
        </p>
      )}

      <DataTable
        columns={columns}
        rows={data?.items}
        getRowKey={(u) => u.id}
        loading={isLoading}
        error={isError}
        emptyIcon={<UserCog className="h-6 w-6" />}
        emptyTitle="Sin usuarios"
      />

      <Modal open={creating} title="Nuevo usuario" onClose={() => setCreating(false)}>
        <CreateUserForm submitting={create.isPending} onCancel={() => setCreating(false)} onSubmit={async (i) => { await create.mutateAsync(i); setCreating(false); }} />
      </Modal>
      <Modal open={!!editing} title="Editar usuario" onClose={() => setEditing(null)}>
        {editing && <EditUserForm user={editing} onDone={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}

function CreateUserForm({ submitting, onSubmit, onCancel }: { submitting: boolean; onSubmit: (i: CreateUserInput) => Promise<void>; onCancel: () => void }) {
  const [f, setF] = useState({ fullName: "", email: "", password: "", role: "SELLER" as AgencyRole, commissionRate: "" });
  const [error, setError] = useState("");
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = createUserSchema.safeParse({
      fullName: f.fullName, email: f.email, password: f.password, role: f.role,
      commissionRate: f.commissionRate.trim() === "" ? null : Number(f.commissionRate),
    });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Datos inválidos"); return; }
    await onSubmit(parsed.data);
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <p className="rounded-btn bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Input label="Nombre *" value={f.fullName} onChange={(e) => set("fullName", e.target.value)} />
      <Input label="Email *" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
      <Input label="Contraseña *" type="password" value={f.password} onChange={(e) => set("password", e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Rol" value={f.role} onChange={(e) => set("role", e.target.value)} options={ROLE_OPTIONS} />
        <Input label="Comisión % (vendedor)" value={f.commissionRate} onChange={(e) => set("commissionRate", e.target.value)} inputMode="decimal" placeholder="0" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={submitting}>Crear</Button>
      </div>
    </form>
  );
}

function EditUserForm({ user, onDone }: { user: UserMgmtRecord; onDone: () => void }) {
  const update = useUpdateUser(user.id);
  const [f, setF] = useState({ fullName: user.fullName, role: user.role, commissionRate: user.commissionRate ? String(Number(user.commissionRate)) : "", isActive: user.isActive, password: "" });
  const [error, setError] = useState("");
  const set = (k: keyof typeof f, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = updateUserSchema.safeParse({
      fullName: f.fullName, role: f.role,
      commissionRate: f.commissionRate.trim() === "" ? null : Number(f.commissionRate),
      isActive: f.isActive, password: f.password || null,
    });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Datos inválidos"); return; }
    await update.mutateAsync(parsed.data as UpdateUserInput);
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <p className="rounded-btn bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Input label="Nombre" value={f.fullName} onChange={(e) => set("fullName", e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Rol" value={f.role} onChange={(e) => set("role", e.target.value)} options={ROLE_OPTIONS} />
        <Input label="Comisión %" value={f.commissionRate} onChange={(e) => set("commissionRate", e.target.value)} inputMode="decimal" />
      </div>
      <Input label="Nueva contraseña (opcional)" type="password" value={f.password} onChange={(e) => set("password", e.target.value)} placeholder="Dejar vacío para no cambiar" />
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" checked={f.isActive} onChange={(e) => set("isActive", e.target.checked)} className="h-4 w-4 cursor-pointer accent-primary" />
        Usuario activo
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>Cancelar</Button>
        <Button type="submit" loading={update.isPending}>Guardar</Button>
      </div>
    </form>
  );
}
