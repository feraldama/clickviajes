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
import { ApiError } from "@/lib/api";
import { SUPPLIER_TYPE_LABELS, SUPPLIER_TYPE_OPTIONS } from "@/lib/options";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  type SupplierRecord,
} from "@/lib/hooks/useSuppliers";

export default function ProveedoresPage() {
  const { data, isLoading } = useSuppliers({ pageSize: 100 });
  const create = useCreateSupplier();
  const del = useDeleteSupplier();

  const [editing, setEditing] = useState<SupplierRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<SupplierRecord | null>(null);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Proveedores"
        description="Hoteles, transporte, guías y seguros usados para calcular el costo de los viajes."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Nuevo proveedor
          </Button>
        }
      />

      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-sm">
        {isLoading ? (
          <div className="grid place-items-center py-16">
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Cargando" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="grid place-items-center gap-3 px-6 py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Truck className="h-6 w-6" />
            </span>
            <p className="font-medium text-foreground">Aún no hay proveedores</p>
            <Button variant="secondary" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Crear el primero
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-muted/50 text-xs uppercase tracking-wide text-muted-fg">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Contacto</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((s) => (
                  <tr key={s.id} className="border-b border-line/60 last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-xs text-foreground">
                        {SUPPLIER_TYPE_LABELS[s.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-fg">
                      {s.email ?? "—"}
                      {s.phone && <span className="block text-xs">{s.phone}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditing(s)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-primary/10 hover:text-primary" aria-label="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setToDelete(s)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-destructive/10 hover:text-destructive" aria-label="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
