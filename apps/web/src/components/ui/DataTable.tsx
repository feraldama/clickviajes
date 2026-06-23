"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import type { SortDir } from "@/lib/hooks/useTableState";

export interface Column<T> {
  /** Clave de ordenamiento del backend. Si se omite, la columna no es ordenable. */
  key?: string;
  header: string;
  align?: "left" | "right" | "center";
  /** Ancho opcional (clase Tailwind, ej. "w-32"). */
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  getRowKey: (row: T) => string;
  loading?: boolean;
  error?: boolean;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyAction?: ReactNode;

  // Orden (servidor)
  sortBy?: string;
  sortDir?: SortDir;
  onSort?: (key: string) => void;

  // Búsqueda (servidor)
  search?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  /** Controles extra (filtros) junto a la búsqueda. */
  toolbar?: ReactNode;

  // Paginación (servidor)
  page?: number;
  totalPages?: number;
  total?: number;
  onPage?: (p: number) => void;
}

const alignClass = { left: "text-left", right: "text-right", center: "text-center" } as const;

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  loading,
  error,
  emptyIcon,
  emptyTitle = "Sin resultados",
  emptyAction,
  sortBy,
  sortDir,
  onSort,
  search,
  onSearch,
  searchPlaceholder = "Buscar…",
  toolbar,
  page,
  totalPages,
  total,
  onPage,
}: DataTableProps<T>) {
  const colCount = columns.length;

  return (
    <div>
      {(onSearch || toolbar) && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {onSearch && (
            <div className="relative min-w-48 max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
              <input
                value={search ?? ""}
                onChange={(e) => onSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-btn border border-line bg-surface py-2.5 pl-10 pr-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-muted/50 text-xs uppercase tracking-wide text-muted-fg">
              <tr>
                {columns.map((col, i) => {
                  const sortable = !!col.key && !!onSort;
                  const active = col.key && col.key === sortBy;
                  return (
                    <th key={i} className={`px-4 py-3 font-semibold ${alignClass[col.align ?? "left"]} ${col.className ?? ""}`}>
                      {sortable ? (
                        <button
                          onClick={() => onSort!(col.key!)}
                          className={`inline-flex cursor-pointer items-center gap-1 hover:text-foreground ${active ? "text-foreground" : ""} ${col.align === "right" ? "flex-row-reverse" : ""}`}
                        >
                          {col.header}
                          {active ? (
                            sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colCount} className="py-16 text-center">
                    <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent align-middle" aria-label="Cargando" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={colCount} className="py-12 text-center text-destructive">No se pudieron cargar los datos.</td>
                </tr>
              ) : !rows || rows.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="py-16">
                    <div className="grid place-items-center gap-3 text-center">
                      {emptyIcon && <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">{emptyIcon}</span>}
                      <p className="font-medium text-foreground">{emptyTitle}</p>
                      {emptyAction}
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={getRowKey(row)} className="border-b border-line/60 last:border-0 hover:bg-muted/30">
                    {columns.map((col, i) => (
                      <td key={i} className={`px-4 py-3 ${alignClass[col.align ?? "left"]} ${col.className ?? ""}`}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {page !== undefined && totalPages !== undefined && total !== undefined && onPage && (
        <Pagination page={page} totalPages={totalPages} total={total} onPage={onPage} />
      )}
    </div>
  );
}
