"use client";

import Link from "next/link";
import { TrendingUp, Wallet, Plane, Users, Gauge } from "lucide-react";
import { formatMoney, type Currency } from "@clickviajes/shared";
import { useAuth } from "@/lib/auth";
import { useDashboard } from "@/lib/hooks/useDashboard";

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("es", { month: "short" }).format(new Date(y!, (m ?? 1) - 1, 1));
}

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.fullName.split(" ")[0] ?? "";
  const { data, isLoading } = useDashboard();
  const cur = (data?.baseCurrency ?? "PYG") as Currency;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-foreground">Hola, {firstName}</h1>
        <p className="mt-1 text-muted-fg">Resumen de tu agencia (últimos 6 meses).</p>
      </header>

      {isLoading || !data ? (
        <div className="grid place-items-center py-20">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Cargando" />
        </div>
      ) : (
        <>
          {data.incomplete && (
            <p className="mb-4 rounded-btn border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              Faltan tasas de cambio para convertir algunos montos a {cur}; ciertos totales pueden estar incompletos.
            </p>
          )}

          {/* KPIs */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Kpi label="Ingresos (6 meses)" value={formatMoney(data.revenue, cur)} icon={TrendingUp} />
            <Kpi label="Por cobrar" value={formatMoney(data.receivable, cur)} icon={Wallet} tone={data.receivable > 0 ? "danger" : "success"} />
            <Kpi label="Reservas activas" value={String(data.activeBookings)} icon={Plane} />
            <Kpi label="Clientes" value={String(data.customers)} icon={Users} />
            <Kpi label="Ocupación de cupos" value={`${data.occupancy.pct}%`} hint={`${data.occupancy.booked}/${data.occupancy.capacity} plazas`} icon={Gauge} />
          </section>

          {/* Ingresos por mes */}
          <section className="mt-6 rounded-card border border-line bg-surface p-6 shadow-sm">
            <h2 className="mb-4 font-display text-lg text-foreground">Ingresos por mes ({cur})</h2>
            <RevenueChart data={data.revenueByMonth} currency={cur} />
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Viajes más vendidos */}
            <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
              <h2 className="mb-4 font-display text-lg text-foreground">Viajes más vendidos</h2>
              {data.topTrips.length === 0 ? (
                <p className="text-sm text-muted-fg">Sin reservas todavía.</p>
              ) : (
                <ul className="space-y-2">
                  {data.topTrips.map((t, i) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 rounded-btn px-2 py-1.5 hover:bg-muted/40">
                      <Link href={`/viajes/${t.id}`} className="flex min-w-0 items-center gap-2">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                        <span className="truncate text-foreground hover:text-primary">{t.name}</span>
                      </Link>
                      <span className="shrink-0 font-mono text-sm text-muted-fg">{t.pax} pax · {t.bookings} res.</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Desempeño por vendedor */}
            <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
              <h2 className="mb-4 font-display text-lg text-foreground">Desempeño por vendedor</h2>
              {data.sellers.length === 0 ? (
                <p className="text-sm text-muted-fg">Sin ventas todavía.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line text-xs uppercase tracking-wide text-muted-fg">
                    <tr>
                      <th className="px-2 py-2 font-semibold">Vendedor</th>
                      <th className="px-2 py-2 text-right font-semibold">Ventas</th>
                      <th className="px-2 py-2 text-right font-semibold">Comisión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sellers.map((s) => (
                      <tr key={s.id} className="border-b border-line/60 last:border-0">
                        <td className="px-2 py-2 text-foreground">{s.name} <span className="text-xs text-muted-fg">({s.bookings})</span></td>
                        <td className="px-2 py-2 text-right font-mono text-foreground">{formatMoney(s.sales, cur)}</td>
                        <td className="px-2 py-2 text-right font-mono text-muted-fg">{formatMoney(s.commission, cur)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, hint, icon: Icon, tone }: { label: string; value: string; hint?: string; icon: typeof TrendingUp; tone?: "success" | "danger" }) {
  const color = tone === "danger" ? "text-destructive" : tone === "success" ? "text-success" : "text-foreground";
  return (
    <article className="rounded-card border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-fg">{label}</span>
        <span className="grid h-9 w-9 place-items-center rounded-btn bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
      </div>
      <p className={`mt-3 font-mono text-2xl font-semibold ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-fg">{hint}</p>}
    </article>
  );
}

function RevenueChart({ data, currency }: { data: Array<{ month: string; amount: number }>; currency: Currency }) {
  const max = Math.max(1, ...data.map((d) => d.amount));
  return (
    <div className="flex items-end gap-3" style={{ height: 180 }}>
      {data.map((d) => (
        <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t bg-primary/80 transition-all hover:bg-primary"
              style={{ height: `${(d.amount / max) * 100}%`, minHeight: d.amount > 0 ? 4 : 0 }}
              title={`${monthLabel(d.month)}: ${formatMoney(d.amount, currency)}`}
            />
          </div>
          <span className="text-xs capitalize text-muted-fg">{monthLabel(d.month)}</span>
        </div>
      ))}
    </div>
  );
}
