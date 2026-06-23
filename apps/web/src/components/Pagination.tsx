import { Button } from "@/components/ui/Button";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  onPage: (p: number) => void;
}

/** Paginador reutilizable para listados con paginación del servidor. */
export function Pagination({ page, totalPages, total, onPage }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-fg">
      <span>
        Página {page} de {totalPages} · {total} registros
      </span>
      <div className="flex gap-2">
        <Button variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Anterior
        </Button>
        <Button variant="ghost" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}
