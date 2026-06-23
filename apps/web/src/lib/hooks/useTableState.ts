"use client";

import { useState } from "react";
import { useDebounce } from "./useDebounce";

export type SortDir = "asc" | "desc";

/**
 * Estado común de una tabla con búsqueda, orden y paginación del servidor.
 * `search` es inmediato (para el input); `debouncedSearch` es el que se manda
 * a la query. Cambiar búsqueda u orden resetea la página a 1.
 */
export function useTableState(defaultSortBy: string, defaultSortDir: SortDir = "desc") {
  const [search, setSearchRaw] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir);

  function onSearch(value: string) {
    setSearchRaw(value);
    setPage(1);
  }

  function onSort(key: string) {
    if (key === sortBy) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  return { search, debouncedSearch, page, setPage, sortBy, sortDir, onSearch, onSort };
}
