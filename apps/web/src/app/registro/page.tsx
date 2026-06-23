"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAgencySchema, type Currency } from "@clickviajes/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { CURRENCY_OPTIONS } from "@/lib/options";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Logo } from "@/components/Logo";
import { toast } from "@/components/ui/Toast";

export default function RegistroPage() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", slug: "", baseCurrency: "PYG" as Currency, adminName: "", adminEmail: "", adminPassword: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  // Sugiere un slug a partir del nombre.
  function onName(v: string) {
    setF((s) => ({
      ...s,
      name: v,
      slug:
        s.slug ||
        v
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = registerAgencySchema.safeParse(f);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Datos inválidos"); return; }
    setSubmitting(true);
    try {
      await apiFetch("/auth/register-agency", { method: "POST", body: parsed.data, auth: false });
      toast.success("Agencia registrada. Inicia sesión.");
      router.replace("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar la agencia.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="aurora-bg relative hidden flex-col justify-between p-12 lg:flex">
        <Logo />
        <div className="max-w-md">
          <h1 className="font-display text-4xl leading-tight text-foreground">Crea tu agencia en Click Viajes</h1>
          <p className="mt-4 text-lg text-foreground/70">Empieza a gestionar clientes, viajes, reservas y cobros en minutos.</p>
        </div>
        <p className="text-sm text-foreground/50">© {new Date().getFullYear()} Click Viajes</p>
      </section>

      <section className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h2 className="font-display text-2xl text-foreground">Registrar agencia</h2>
          <p className="mt-1 text-sm text-muted-fg">Crea tu agencia y tu usuario administrador.</p>

          <form onSubmit={submit} className="mt-8 flex flex-col gap-4" noValidate>
            {error && <div role="alert" className="rounded-btn border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
            <Input label="Nombre de la agencia" value={f.name} onChange={(e) => onName(e.target.value)} />
            <Input label="Identificador (slug)" value={f.slug} onChange={(e) => set("slug", e.target.value)} placeholder="mi-agencia" />
            <Select label="Moneda base" value={f.baseCurrency} onChange={(e) => set("baseCurrency", e.target.value)} options={CURRENCY_OPTIONS} />
            <div className="mt-2 border-t border-line pt-4">
              <p className="mb-3 text-sm font-medium text-foreground">Tu cuenta de administrador</p>
              <div className="flex flex-col gap-4">
                <Input label="Tu nombre" value={f.adminName} onChange={(e) => set("adminName", e.target.value)} />
                <Input label="Email" type="email" value={f.adminEmail} onChange={(e) => set("adminEmail", e.target.value)} />
                <Input label="Contraseña" type="password" value={f.adminPassword} onChange={(e) => set("adminPassword", e.target.value)} />
              </div>
            </div>
            <Button type="submit" loading={submitting} className="mt-2 w-full">Crear agencia</Button>
            <p className="text-center text-sm text-muted-fg">
              ¿Ya tienes cuenta? <Link href="/login" className="text-primary hover:underline">Inicia sesión</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
