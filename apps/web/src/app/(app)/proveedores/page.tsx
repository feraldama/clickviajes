"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
import { supplierSchema, type SupplierInput } from "@clickviajes/shared";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { ApiError } from "@/lib/api";
import { useTableState } from "@/lib/hooks/useTableState";
import { SUPPLIER_TYPE_LABELS, SUPPLIER_TYPE_OPTIONS } from "@/lib/options";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  type SupplierRecord,
} from "@/lib/hooks/useSuppliers";

export default function ProveedoresPage() {
  const t = useTableState("name", "asc");
  const { data, isLoading, isError } = useSuppliers({
    search: t.debouncedSearch,
    page: t.page,
    pageSize: 20,
    sortBy: t.sortBy,
    sortDir: t.sortDir,
  });
  const create = useCreateSupplier();
  const del = useDeleteSupplier();

  const [editing, setEditing] = useState<SupplierRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<SupplierRecord | null>(null);

  const columns: Column<SupplierRecord>[] = [
    { key: "name", header: "Nombre", render: (s) => <span className="font-medium text-foreground">{s.name}</span> },
    { key: "type", header: "Tipo", render: (s) => <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-xs text-foreground">{SUPPLIER_TYPE_LABELS[s.type]}</span> },
    {
      header: "Contacto",
      render: (s) => (
        <div className="text-muted-fg">
          {s.email ?? "—"}
          {s.phone && <span className="block text-xs">{s.phone}</span>}
        </div>
      ),
    },
    {
      header: "Acciones",
      align: "right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => setEditing(s)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-primary/10 hover:text-primary" aria-label="Editar"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setToDelete(s)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-destructive/10 hover:text-destructive" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Proveedores"
        description="Hoteles, transporte, guías y seguros usados para calcular el costo de los viajes."
        action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nuevo proveedor</Button>}
      />

      <DataTable
        columns={columns}
        rows={data?.items}
        getRowKey={(s) => s.id}
        loading={isLoading}
        error={isError}
        emptyIcon={<Truck className="h-6 w-6" />}
        emptyTitle={t.debouncedSearch ? "Sin resultados" : "Aún no hay proveedores"}
        emptyAction={!t.debouncedSearch ? <Button variant="secondary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Crear el primero</Button> : undefined}
        search={t.search}
        onSearch={t.onSearch}
        searchPlaceholder="Buscar proveedor…"
        sortBy={t.sortBy}
        sortDir={t.sortDir}
        onSort={t.onSort}
        page={data?.page}
        totalPages={data?.totalPages}
        total={data?.total}
        onPage={t.setPage}
      />

      <Modal open={creating} title="Nuevo proveedor" onClose={() => setCreating(false)}>
        <SupplierFormFields
          submitting={create.isPending}
          onCancel={() => setCreating(false)}
          onSubmit={async (input) => {
            await create.mutateAsync(input);
            setCreating(false);
          }}
        />
      </Modal>

      <Modal open={!!editing} title="Editar proveedor" onClose={() => setEditing(null)}>
        {editing && <EditSupplierForm supplier={editing} onDone={() => setEditing(null)} />}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar proveedor"
        message={`¿Eliminar a "${toDelete?.name}"? Esta acción no se puede deshacer.`}
        loading={del.isPending}
        onConfirm={async () => {
          if (toDelete) await del.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function EditSupplierForm({ supplier, onDone }: { supplier: SupplierRecord; onDone: () => void }) {
  const update = useUpdateSupplier(supplier.id);
  return (
    <SupplierFormFields
      initial={supplier}
      submitting={update.isPending}
      onCancel={onDone}
      onSubmit={async (input) => {
        await update.mutateAsync(input);
        onDone();
      }}
    />
  );
}

function SupplierFormFields({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: SupplierRecord;
  submitting: boolean;
  onSubmit: (input: SupplierInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(initial?.type ?? "HOTEL");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");
    const parsed = supplierSchema.safeParse({
      name,
      type,
      email: email.trim() || null,
      phone: phone.trim() || null,
      notes: notes.trim() || null,
    });
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setErrors({ name: fe.name?.[0] ?? "", email: fe.email?.[0] ?? "" });
      return;
    }
    try {
      await onSubmit(parsed.data);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo guardar.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {formError && <p className="rounded-btn bg-destructive/5 px-3 py-2 text-sm text-destructive">{formError}</p>}
      <Input label="Nombre *" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
      <Select label="Tipo" value={type} onChange={(e) => setType(e.target.value as typeof type)} options={SUPPLIER_TYPE_OPTIONS} />
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      <Input label="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <Textarea label="Notas" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={submitting}>Guardar</Button>
      </div>
    </form>
  );
}
