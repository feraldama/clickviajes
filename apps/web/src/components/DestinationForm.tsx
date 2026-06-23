"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { destinationSchema, type DestinationInput } from "@clickviajes/shared";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { DestinationRecord } from "@/lib/hooks/useDestinations";

interface AttrRow {
  name: string;
  description: string;
}

interface Props {
  initial?: DestinationRecord;
  submitting: boolean;
  onSubmit: (input: DestinationInput) => Promise<void>;
}

export function DestinationForm({ initial, submitting, onSubmit }: Props) {
  const router = useRouter();

  const [name, setName] = useState(initial?.name ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [recommendedSeason, setRecommendedSeason] = useState(initial?.recommendedSeason ?? "");
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [photoInput, setPhotoInput] = useState("");
  const [attractions, setAttractions] = useState<AttrRow[]>(
    initial?.attractions.map((a) => ({ name: a.name, description: a.description ?? "" })) ?? [],
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  function addPhoto() {
    const url = photoInput.trim();
    if (!url) return;
    setPhotos((p) => [...p, url]);
    setPhotoInput("");
  }
  function removePhoto(i: number) {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
  }

  function addAttr() {
    setAttractions((a) => [...a, { name: "", description: "" }]);
  }
  function updateAttr(i: number, patch: Partial<AttrRow>) {
    setAttractions((a) => a.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeAttr(i: number) {
    setAttractions((a) => a.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");

    const parsed = destinationSchema.safeParse({
      name,
      country,
      city: city.trim() || null,
      description: description.trim() || null,
      recommendedSeason: recommendedSeason.trim() || null,
      photos,
      attractions: attractions
        .filter((a) => a.name.trim())
        .map((a) => ({ name: a.name.trim(), description: a.description.trim() || null })),
    });

    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setErrors({ name: fe.name?.[0] ?? "", country: fe.country?.[0] ?? "", photos: fe.photos?.[0] ?? "" });
      return;
    }

    try {
      await onSubmit(parsed.data);
      router.push("/destinos");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo guardar el destino.");
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
        <h2 className="mb-4 font-display text-lg text-foreground">Datos del destino</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre *" name="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
          <Input label="País *" name="country" value={country} onChange={(e) => setCountry(e.target.value)} error={errors.country} />
          <Input label="Ciudad" name="city" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input label="Temporada recomendada" name="recommendedSeason" value={recommendedSeason} onChange={(e) => setRecommendedSeason(e.target.value)} placeholder="Ej. Mayo a septiembre" />
        </div>
        <div className="mt-4">
          <Textarea label="Descripción" name="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-1 font-display text-lg text-foreground">Fotos</h2>
        <p className="mb-4 text-sm text-muted-fg">Agrega URLs de imágenes del destino.</p>
        <div className="flex gap-2">
          <input
            value={photoInput}
            onChange={(e) => setPhotoInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPhoto();
              }
            }}
            placeholder="https://…"
            className="flex-1 rounded-btn border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
          <Button type="button" variant="secondary" onClick={addPhoto}>
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>
        {errors.photos && <p className="mt-1 text-sm text-destructive">{errors.photos}</p>}
        {photos.length > 0 && (
          <ul className="mt-3 space-y-2">
            {photos.map((url, i) => (
              <li key={i} className="flex items-center justify-between gap-2 rounded-btn bg-muted px-3 py-2 text-sm">
                <span className="truncate text-muted-fg">{url}</span>
                <button type="button" onClick={() => removePhoto(i)} className="cursor-pointer text-destructive hover:underline" aria-label="Quitar foto">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-foreground">Atracciones / actividades</h2>
          <Button type="button" variant="secondary" onClick={addAttr} className="!px-3 !py-1.5 text-xs">
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>
        {attractions.length === 0 ? (
          <p className="text-sm text-muted-fg">Sin atracciones cargadas.</p>
        ) : (
          <div className="space-y-4">
            {attractions.map((a, i) => (
              <div key={i} className="rounded-btn border border-line p-4">
                <div className="grid gap-3">
                  <Input label="Nombre" value={a.name} onChange={(e) => updateAttr(i, { name: e.target.value })} />
                  <Input label="Descripción" value={a.description} onChange={(e) => updateAttr(i, { description: e.target.value })} />
                </div>
                <button type="button" onClick={() => removeAttr(i)} className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm text-destructive hover:underline">
                  <Trash2 className="h-4 w-4" /> Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/destinos")}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? "Guardar cambios" : "Crear destino"}
        </Button>
      </div>
    </form>
  );
}
