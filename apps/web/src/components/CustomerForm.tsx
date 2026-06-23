"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import {
  calcularRuc,
  customerSchema,
  fechaInputValue,
  DOCUMENT_TYPES,
  type CustomerInput,
  type DocumentType,
  type PersonType,
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
  issueDate: string; // aaaa-mm-dd (valor de <input type="date">)
  expiryDate: string; // aaaa-mm-dd
  notes: string;
}

interface Props {
  initial?: CustomerRecord;
  submitting: boolean;
  onSubmit: (input: CustomerInput) => Promise<void>;
}

export function CustomerForm({ initial, submitting, onSubmit }: Props) {
  const router = useRouter();

  const [personType, setPersonType] = useState<PersonType>(initial?.personType ?? "PHYSICAL");
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [ci, setCi] = useState(initial?.ci ?? "");
  const [ruc, setRuc] = useState(initial?.ruc ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [birthDate, setBirthDate] = useState(fechaInputValue(initial?.birthDate));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [docs, setDocs] = useState<DocRow[]>(
    initial?.documents.map((d) => ({
      type: d.type,
      number: d.number,
      issueDate: fechaInputValue(d.issueDate),
      expiryDate: fechaInputValue(d.expiryDate),
      notes: d.notes ?? "",
    })) ?? [],
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>("");

  const isJuridica = personType === "JURIDICAL";
  // Física: RUC derivado del CI (solo lectura). Jurídica: RUC editable directo.
  const rucValue = isJuridica ? ruc : ci.trim() ? calcularRuc(ci) : "";

  function addDoc() {
    setDocs((d) => [...d, { type: "PASSPORT", number: "", issueDate: "", expiryDate: "", notes: "" }]);
  }
  function updateDoc(i: number, patch: Partial<DocRow>) {
    setDocs((d) => d.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeDoc(i: number) {
    setDocs((d) => d.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");

    let payload: CustomerInput;
    try {
      const raw = {
        personType,
        firstName,
        lastName: isJuridica ? "" : lastName,
        ci: ci.trim() || null,
        ruc: rucValue.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        // El input nativo entrega aaaa-mm-dd, que z.coerce.date() acepta directo.
        birthDate: birthDate || null,
        notes: notes.trim() || null,
        documents: docs.map((d) => ({
          type: d.type,
          number: d.number,
          issueDate: d.issueDate || null,
          expiryDate: d.expiryDate || null,
          notes: d.notes.trim() || null,
        })),
      };
      const parsed = customerSchema.safeParse(raw);
      if (!parsed.success) {
        const fe = parsed.error.flatten().fieldErrors;
        setErrors({
          firstName: fe.firstName?.[0] ?? "",
          lastName: fe.lastName?.[0] ?? "",
          ruc: fe.ruc?.[0] ?? "",
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
        <h2 className="mb-4 font-display text-lg text-foreground">Datos {isJuridica ? "de la empresa" : "personales"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Select
              label="Tipo de cliente"
              value={personType}
              onChange={(e) => setPersonType(e.target.value as PersonType)}
              options={[
                { value: "PHYSICAL", label: "Persona física" },
                { value: "JURIDICAL", label: "Persona jurídica" },
              ]}
            />
          </div>

          <div className={isJuridica ? "sm:col-span-2" : ""}>
            <Input label={isJuridica ? "Razón social *" : "Nombre *"} name="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} error={errors.firstName} />
          </div>
          {!isJuridica && (
            <Input label="Apellido *" name="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} error={errors.lastName} />
          )}

          <Input label={isJuridica ? "CI (opcional)" : "CI"} name="ci" value={ci} onChange={(e) => setCi(e.target.value)} placeholder="Ej. 1234567" />

          {isJuridica ? (
            <Input label="RUC *" name="ruc" value={ruc} onChange={(e) => setRuc(e.target.value)} error={errors.ruc} placeholder="80012345-6" />
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">RUC</label>
              <div className="rounded-btn border border-line bg-muted px-3 py-2.5 font-mono text-base text-foreground">
                {rucValue || <span className="text-muted-fg">Se calcula desde el CI</span>}
              </div>
              <p className="text-xs text-muted-fg">Calculado automáticamente (dígito verificador módulo 11).</p>
            </div>
          )}

          <Input label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <Input label="Teléfono" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {!isJuridica && (
            <Input label="Fecha de nacimiento" name="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={fechaInputValue(new Date())} />
          )}
          <Input label="Dirección" name="address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="mt-4">
          <Textarea label="Notas / seguimiento" name="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-foreground">Documentos</h2>
          <Button type="button" variant="secondary" onClick={addDoc} className="px-3! py-1.5! text-xs">
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
                  <Input label="Emisión" type="date" value={d.issueDate} onChange={(e) => updateDoc(i, { issueDate: e.target.value })} />
                  <Input label="Vencimiento" type="date" value={d.expiryDate} onChange={(e) => updateDoc(i, { expiryDate: e.target.value })} />
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
