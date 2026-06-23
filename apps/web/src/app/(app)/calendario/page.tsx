"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plane, Wallet, FileWarning } from "lucide-react";
import { formatMoney, type AgendaEvent, type AgendaEventType, type Currency } from "@clickviajes/shared";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { useAgenda } from "@/lib/hooks/useAgenda";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const TYPE_META: Record<AgendaEventType, { label: string; chip: string; icon: typeof Plane; link: (id: string) => string }> = {
  TRIP: { label: "Salidas", chip: "bg-primary/15 text-primary hover:bg-primary/25", icon: Plane, link: (id) => `/viajes/${id}` },
  INSTALLMENT: { label: "Cuotas", chip: "bg-accent/15 text-accent hover:bg-accent/25", icon: Wallet, link: (id) => `/reservas/${id}/cuenta` },
  DOCUMENT: { label: "Documentos", chip: "bg-amber-100 text-amber-700 hover:bg-amber-200", icon: FileWarning, link: (id) => `/clientes/${id}` },
};

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CalendarioPage() {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [active, setActive] = useState<Record<AgendaEventType, boolean>>({ TRIP: true, INSTALLMENT: true, DOCUMENT: true });

  // Grilla de 42 días empezando el lunes anterior al día 1.
  const gridStart = useMemo(() => {
    const offset = (cursor.getDay() + 6) % 7; // lunes = 0
    return new Date(cursor.getFullYear(), cursor.getMonth(), 1 - offset);
  }, [cursor]);
  const days = useMemo(() => Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)), [gridStart]);
  const gridEnd = days[41]!;

  const { data: events } = useAgenda(ymd(gridStart), ymd(gridEnd));

  const byDay = useMemo(() => {
    const map = new Map<string, AgendaEvent[]>();
    for (const e of events ?? []) {
      if (!active[e.type]) continue;
      const key = ymd(new Date(e.date));
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [events, active]);

  const monthLabel = new Intl.DateTimeFormat("es", { month: "long", year: "numeric" }).format(cursor);
  const todayKey = ymd(new Date());

  function shiftMonth(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Calendario" description="Salidas, vencimientos de cuotas y de documentos en un solo lugar." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftMonth(-1)} className="grid h-9 w-9 cursor-pointer place-items-center rounded-btn border border-line text-muted-fg hover:bg-muted" aria-label="Mes anterior"><ChevronLeft className="h-5 w-5" /></button>
          <span className="min-w-44 text-center font-display text-lg capitalize text-foreground">{monthLabel}</span>
          <button onClick={() => shiftMonth(1)} className="grid h-9 w-9 cursor-pointer place-items-center rounded-btn border border-line text-muted-fg hover:bg-muted" aria-label="Mes siguiente"><ChevronRight className="h-5 w-5" /></button>
          <Button variant="ghost" onClick={() => setCursor(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); })}>Hoy</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_META) as AgendaEventType[]).map((t) => {
            const meta = TYPE_META[t];
            const on = active[t];
            const Icon = meta.icon;
            return (
              <button
                key={t}
                onClick={() => setActive((a) => ({ ...a, [t]: !a[t] }))}
                aria-pressed={on}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${on ? meta.chip : "border-line text-muted-fg opacity-60"}`}
              >
                <Icon className="h-4 w-4" /> {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-sm">
        <div className="grid grid-cols-7 border-b border-line bg-muted/50 text-center text-xs font-semibold uppercase tracking-wide text-muted-fg">
          {WEEKDAYS.map((w) => <div key={w} className="px-2 py-2">{w}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, idx) => {
            const key = ymd(d);
            const inMonth = d.getMonth() === cursor.getMonth();
            const isToday = key === todayKey;
            const dayEvents = byDay.get(key) ?? [];
            return (
              <div key={idx} className={`min-h-28 border-b border-r border-line/60 p-1.5 ${idx % 7 === 6 ? "border-r-0" : ""} ${inMonth ? "" : "bg-muted/20"}`}>
                <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs ${isToday ? "bg-primary font-semibold text-white" : inMonth ? "text-foreground" : "text-muted-fg/50"}`}>
                  {d.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 4).map((e) => {
                    const meta = TYPE_META[e.type];
                    const label = e.type === "INSTALLMENT" && e.amount ? `${e.title} · ${formatMoney(e.amount, e.currency as Currency)}` : e.title;
                    return (
                      <Link key={e.id} href={meta.link(e.refId)} title={`${e.subtitle}: ${label}`} className={`block truncate rounded px-1.5 py-0.5 text-xs transition-colors ${meta.chip}`}>
                        {label}
                      </Link>
                    );
                  })}
                  {dayEvents.length > 4 && <p className="px-1.5 text-xs text-muted-fg">+{dayEvents.length - 4} más</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
