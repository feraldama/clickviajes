"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type ToastKind = "success" | "error";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

let items: ToastItem[] = [];
let listeners: Array<(items: ToastItem[]) => void> = [];
let nextId = 1;

function emit() {
  for (const l of listeners) l(items);
}

function dismiss(id: number) {
  items = items.filter((i) => i.id !== id);
  emit();
}

function push(kind: ToastKind, message: string) {
  const id = nextId++;
  items = [...items, { id, kind, message }];
  emit();
  setTimeout(() => dismiss(id), 4000);
}

/** API global de toasts; usable desde cualquier parte (hooks incluidos). */
export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
};

/** Render de los toasts. Montar una vez en los Providers. */
export function ToastViewport() {
  const [list, setList] = useState<ToastItem[]>(items);

  useEffect(() => {
    listeners.push(setList);
    return () => {
      listeners = listeners.filter((l) => l !== setList);
    };
  }, []);

  if (list.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2" aria-live="polite">
      {list.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`flex items-start gap-3 rounded-btn border bg-surface px-4 py-3 shadow-lg ${
            t.kind === "success" ? "border-success/30" : "border-destructive/30"
          }`}
        >
          {t.kind === "success" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          )}
          <p className="flex-1 text-sm text-foreground">{t.message}</p>
          <button
            onClick={() => dismiss(t.id)}
            className="cursor-pointer text-muted-fg hover:text-foreground"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
