/**
 * Cálculo del RUC paraguayo a partir del CI (Cédula de Identidad).
 *
 * El RUC de una persona física en Paraguay es el número de CI seguido de un
 * dígito verificador calculado con el algoritmo de **módulo 11** definido por
 * la SET (Subsecretaría de Estado de Tributación), en formato `CI-DV`.
 *
 * Esta función es una pieza CRÍTICA: la usan tanto el frontend (autocompletar
 * el RUC al ingresar el CI) como el backend (validar). Debe dar exactamente el
 * mismo resultado en ambos lados, por eso vive en el paquete compartido y tiene
 * tests dedicados (ver ruc.test.ts). Será la base de la futura integración con
 * SIFEN (facturación electrónica).
 */

/**
 * Calcula el dígito verificador (módulo 11) de un identificador.
 *
 * Algoritmo SET:
 *  - Se recorre el número de derecha a izquierda.
 *  - Cada caracter se multiplica por un factor cíclico 2, 3, …, `base`.
 *  - Los dígitos usan su valor numérico; las letras (extranjeros/jurídicos
 *    con caracteres alfabéticos) usan su código ASCII en mayúscula.
 *  - Se suma todo, se obtiene el resto módulo `base`.
 *  - Si el resto es > 1, el DV es `base - resto`; en caso contrario es 0.
 *
 * @param identificador CI o identificador base (se ignoran puntos/guiones/espacios).
 * @param base Base del módulo (por defecto 11, estándar de Paraguay).
 * @returns Dígito verificador (0–9).
 */
export function calcularDigitoVerificador(identificador: string, base = 11): number {
  const limpio = normalizarIdentificador(identificador);
  if (limpio.length === 0) {
    throw new Error("El identificador no puede estar vacío para calcular el dígito verificador.");
  }

  let total = 0;
  let factor = 2;

  for (let i = limpio.length - 1; i >= 0; i--) {
    const code = limpio.charCodeAt(i);
    // Dígito '0'–'9' (48–57) => valor numérico; letra A–Z => su código ASCII.
    const valor = code >= 48 && code <= 57 ? code - 48 : code;
    total += valor * factor;
    factor = factor >= base ? 2 : factor + 1;
  }

  const resto = total % base;
  return resto > 1 ? base - resto : 0;
}

/**
 * Calcula el RUC en formato `CI-DV` a partir de un CI.
 *
 * @param ci Cédula de identidad (se ignoran puntos, guiones y espacios).
 * @returns RUC en formato `NUMERO-DV`, p. ej. `1234567-9`.
 */
export function calcularRuc(ci: string): string {
  const limpio = normalizarIdentificador(ci);
  const dv = calcularDigitoVerificador(limpio);
  return `${limpio}-${dv}`;
}

/**
 * Valida que un RUC con formato `CI-DV` tenga un dígito verificador correcto.
 *
 * @param ruc RUC completo en formato `NUMERO-DV`.
 * @returns `true` si el dígito verificador coincide con el calculado.
 */
export function esRucValido(ruc: string): boolean {
  const partes = ruc.trim().split("-");
  if (partes.length !== 2) return false;
  const [numero, dv] = partes;
  if (!numero || dv === undefined || dv.length !== 1) return false;
  try {
    return calcularDigitoVerificador(numero) === Number(dv);
  } catch {
    return false;
  }
}

/** Quita puntos, guiones, espacios y pasa a mayúsculas. */
function normalizarIdentificador(valor: string): string {
  return valor.toUpperCase().replace(/[^0-9A-Z]/g, "");
}
