"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import {
  calcularRuc,
  customerSchema,
  fechaIsoDesdeInput,
  formatFecha,
  parseFecha,
  DOCUMENT_TYPES,
  type CustomerInput,
  type DocumentType,
} from "@clickviajes/shared";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import type { CustomerRecord } from "@/lib/hooks/useCustomers";

const DOC_LABELS: Record<DocumentType, string> = {
  PASSPORT: "Pasaporte",
  VISA: "Visa",
  ID_CARD: "Cédula / DNI",
  OTHER: "Otro",
};

interface DocRow {
  type: DocumentType;
  number: string;
  issueDate: string; // dd/mm/aaaa
  expiryDate: string; // dd/mm/aaaa
  notes: string;
}

interface Props {
  initial?: CustomerRecord;
  submitting: boolean;
  onSubmit: (input: CustomerInput) => Promise<void>;
}

export function CustomerForm({ initial, submitting, onSubmit }: Props) {
  const router = useRouter();

  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [ci, setCi] = useState(initial?.ci ?? "");
  const [ruc, setRuc] = useState(initial?.ruc ?? "");
  const [rucTouched, setRucTouched] = useState(!!initial?.ruc);
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [birthDate, setBirthDate] = useState(initial?.birthDate ? formatFecha(initial.birthDate) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [docs, setDocs] = useState<DocRow[]>(
    initial?.documents.map((d) => ({
      type: d.type,
      number: d.number,
      issueDate: d.issueDate ? formatFecha(d.issueDate) : "",
      expiryDate: d.expiryDate ? formatFecha(d.expiryDate) : "",
      notes: d.notes ?? "",
    })) ?? [],
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>("");

  // RUC: autocalculado desde el CI mientras el usuario no lo edite manualmente.
  const rucValue = rucTouched ? ruc : ci.trim() ? calcularRuc(ci) : "";

  function addDoc() {
    setDocs((d) => [...d, { type: "PASSPORT", number: "", issueDate: "", expiryDate: "", notes: "" }]);
  }
  function updateDoc(i: number, patch: Partial<DocRow>) {
    setDocs((d) => d.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeDoc(i: number) {
    setDocs((d) => d.filter((_, idx) => idx !== i));
  }

  /** Convierte dd/mm/aaaa a ISO; devuelve undefined si vacío, lanza si inválido. */
  function fechaOpcional(valor: string, campo: string): string | null {
    if (!valor.trim()) return null;
    if (!parseFecha(valor)) throw new Error(`Fecha inválida en ${campo} (usa dd/mm/aaaa)`);
    return fechaIsoDesdeInput(valor);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");

    let payload: CustomerInput;
    try {
      const raw = {
        firstName,
        lastName,
        ci: ci.trim() || null,
        // Si el usuario no tocó el RUC, dejamos que el backend lo autocalcule.
        ruc: rucTouched ? ruc.trim() || null : null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        birthDate: fechaOpcional(birthDate, "fecha de nacimiento"),
        notes: notes.trim() || null,
        documents: docs.map((d, i) => ({
          type: d.type,
          number: d.number,
          issueDate: fechaOpcional(d.issueDate, `documento ${i + 1} (emisión)`),
          expiryDate: fechaOpcional(d.expiryDate, `documento ${i + 1} (vencimiento)`),
          notes: d.notes.trim() || null,
        })),
      };
      const parsed = customerSchema.safeParse(raw);
      if (!parsed.success) {
        const fe = parsed.error.flatten().fieldErrors;
        setErrors({
          firstName: fe.firstName?.[0] ?? "",
          lastName: fe.lastName?.[0] ?? "",
          email: fe.email?.[0] ?? "",
        });
        return;
      }
      payload = parsed.data;
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Datos inválidos");
      return;
    }

    try {
      await onSubmit(payload);
      router.push("/clientes");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo guardar el cliente.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6" noValidate>
      {formError && (
        <div role="alert" className="rounded-btn border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {formError}
        </div>
      )}

      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg text-foreground">Datos personales</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre *" name="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} error={errors.firstName} />
          <Input label="Apellido *" name="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} error={errors.lastName} />
          <Input label="CI" name="ci" value={ci} onChange={(e) => setCi(e.target.value)} placeholder="Ej. 1234567" />
          <Input
            label="RUC (autocalculado desde el CI)"
            name="ruc"
            value={rucValue}
            onChange={(e) => {
              setRucTouched(true);
              setRuc(e.target.value);
            }}
            placeholder="Se completa solo"
          />
          <Input label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <Input label="Teléfono" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Fecha de nacimiento" name="birthDate" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} placeholder="dd/mm/aaaa" inputMode="numeric" />
          <Input label="Dirección" name="address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="mt-4">
          <Textarea label="Notas / seguimiento" name="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-foreground">Documentos</h2>
          <Button type="button" variant="secondary" onClick={addDoc} className="!px-3 !py-1.5 text-xs">
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>

        {docs.length === 0 ? (
          <p className="text-sm text-muted-fg">Sin documentos. Agrega pasaporte, visa o cédula con su vencimiento.</p>
        ) : (
          <div className="space-y-4">
            {docs.map((d, i) => (
              <div key={i} className="rounded-btn border border-line p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select
                    label="Tipo"
                    value={d.type}
                    onChange={(e) => updateDoc(i, { type: e.target.value as DocumentType })}
                    options={DOCUMENT_TYPES.map((t) => ({ value: t, label: DOC_LABELS[t] }))}
                  />
                  <Input label="Número" value={d.number} onChange={(e) => updateDoc(i, { number: e.target.value })} />
                  <Input label="Emisión" value={d.issueDate} onChange={(e) => updateDoc(i, { issueDate: e.target.value })} placeholder="dd/mm/aaaa" inputMode="numeric" />
                  <Input label="Vencimiento" value={d.expiryDate} onChange={(e) => updateDoc(i, { expiryDate: e.target.value })} placeholder="dd/mm/aaaa" inputMode="numeric" />
                </div>
                <button
                  type="button"
                  onClick={() => removeDoc(i)}
                  className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm text-destructive hover:underline"
                >
                  <Trash2 className="h-4 w-4" /> Quitar documento
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/clientes")}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? "Guardar cambios" : "Crear cliente"}
        </Button>
      </div>
    </form>
  );
}
