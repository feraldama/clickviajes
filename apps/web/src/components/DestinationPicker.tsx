"use client";

import { useDestinations } from "@/lib/hooks/useDestinations";

interface Props {
  selected: string[];
  onChange: (ids: string[]) => void;
}

/** Selector de destinos (multi) como chips toggle. */
export function DestinationPicker({ selected, onChange }: Props) {
  const { data, isLoading } = useDestinations({ pageSize: 100 });

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  if (isLoading) return <p className="text-sm text-muted-fg">Cargando destinos…</p>;
  if (!data || data.items.length === 0)
    return <p className="text-sm text-muted-fg">No hay destinos. Crea destinos primero para asociarlos.</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {data.items.map((d) => {
        const active = selected.includes(d.id);
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => toggle(d.id)}
            aria-pressed={active}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors duration-150 ${
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-line text-muted-fg hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {d.name}
            <span className="ml-1 text-xs opacity-70">{d.country}</span>
          </button>
        );
      })}
    </div>
  );
}
