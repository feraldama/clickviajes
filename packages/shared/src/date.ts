/**
 * Helpers centrales de fecha.
 *
 * Regla del proyecto: en la BD las fechas se guardan en formato estándar
 * (ISO / UTC); la conversión al formato `dd/mm/aaaa` que ve el usuario se hace
 * SIEMPRE con estos helpers, nunca a mano en los componentes.
 */

/** Convierte cualquier entrada de fecha a un objeto Date, o null si es inválida. */
function aDate(valor: Date | string | number | null | undefined): Date | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const d = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Formatea una fecha como `dd/mm/aaaa`.
 * @returns La fecha formateada, o cadena vacía si la entrada es inválida.
 */
export function formatFecha(valor: Date | string | number | null | undefined): string {
  const d = aDate(valor);
  if (!d) return "";
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

/**
 * Formatea una fecha como `dd/mm/aaaa HH:mm`.
 */
export function formatFechaHora(valor: Date | string | number | null | undefined): string {
  const d = aDate(valor);
  if (!d) return "";
  const hora = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${formatFecha(d)} ${hora}:${min}`;
}

/**
 * Parsea una cadena `dd/mm/aaaa` a un objeto Date (hora local a medianoche).
 * @returns El Date correspondiente, o null si el formato es inválido.
 */
export function parseFecha(valor: string): Date | null {
  const m = valor.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const anio = Number(m[3]);
  const d = new Date(anio, mes - 1, dia);
  // Verifica que no haya overflow (ej. 31/02/2024 -> marzo).
  if (d.getDate() !== dia || d.getMonth() !== mes - 1 || d.getFullYear() !== anio) {
    return null;
  }
  return d;
}

/** Convierte una cadena `dd/mm/aaaa` a formato ISO `aaaa-mm-dd`, o null. */
export function fechaIsoDesdeInput(valor: string): string | null {
  const d = parseFecha(valor);
  if (!d) return null;
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * Convierte cualquier fecha al valor `aaaa-mm-dd` que espera un
 * `<input type="date">` nativo. Cadena vacía si la entrada es inválida.
 */
export function fechaInputValue(valor: Date | string | number | null | undefined): string {
  const d = aDate(valor);
  if (!d) return "";
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * Parsea el valor `aaaa-mm-dd` de un `<input type="date">` a un Date
 * (medianoche en hora local), o null si está vacío o es inválido.
 */
export function fechaDesdeInput(valor: string): Date | null {
  const m = valor.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const anio = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  const d = new Date(anio, mes - 1, dia);
  if (d.getDate() !== dia || d.getMonth() !== mes - 1 || d.getFullYear() !== anio) {
    return null;
  }
  return d;
}
