"use client";

import { TrendingUp, Wallet, Plane, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface Kpi {
  label: string;
  value: string;
  hint: string;
  icon: typeof TrendingUp;
}

// Placeholder: los valores reales llegan con el módulo de reportes (Fase 8).
const KPIS: Kpi[] = [
  { label: "Ingresos del mes", value: "—", hint: "Disponible en Fase 8", icon: TrendingUp },
  { label: "Cuentas por cobrar", value: "—", hint: "Disponible en Fase 6", icon: Wallet },
  { label: "Reservas activas", value: "—", hint: "Disponible en Fase 5", icon: Plane },
  { label: "Clientes", value: "—", hint: "Disponible en Fase 3", icon: Users },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.fullName.split(" ")[0] ?? "";

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-foreground">Hola, {firstName}</h1>
        <p className="mt-1 text-muted-fg">Este es el resumen de tu agencia. Los indicadores se activan al avanzar las fases.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map(({ label, value, hint, icon: Icon }) => (
          <article
            key={label}
            className="rounded-card border border-line bg-surface p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-fg">{label}</span>
              <span className="grid h-9 w-9 place-items-center rounded-btn bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 font-mono text-3xl font-semibold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-fg">{hint}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-card border border-dashed border-line bg-surface/60 p-10 text-center">
        <h2 className="font-display text-xl text-foreground">Fase 2 completada ✓</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-fg">
          Autenticación, roles y aislamiento por agencia están funcionando. Los módulos de Clientes,
          Destinos, Viajes y demás se construyen en las próximas fases.
        </p>
      </section>
    </div>
  );
}
