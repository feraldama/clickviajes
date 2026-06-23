"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Diálogo de confirmación para acciones destructivas. Scrim 50% (regla MASTER). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Eliminar",
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="w-full max-w-md rounded-modal bg-surface p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 id="confirm-title" className="font-display text-lg text-foreground">
              {title}
            </h3>
            <p className="mt-1 text-sm text-muted-fg">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            loading={loading}
            className="bg-destructive! hover:bg-destructive/90!"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
