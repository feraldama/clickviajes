import { describe, it, expect } from "vitest";
import { calcularDigitoVerificador, calcularRuc, esRucValido } from "./ruc";

describe("calcularDigitoVerificador (módulo 11)", () => {
  // Vectores calculados con el algoritmo estándar SET (módulo 11).
  // ⚠️ PENDIENTE: cruzar estos pares con CI→RUC reales verificados contra la
  //    SET antes de considerar cerrada esta pieza (pregunta abierta del diseño).
  it.each([
    ["1234567", 9],
    ["4185050", 5],
    ["500", 2],
    ["2160526", 2],
  ])("CI %s -> DV %i", (ci, dvEsperado) => {
    expect(calcularDigitoVerificador(ci)).toBe(dvEsperado);
  });

  it("ignora puntos, guiones y espacios", () => {
    expect(calcularDigitoVerificador("1.234.567")).toBe(calcularDigitoVerificador("1234567"));
    expect(calcularDigitoVerificador(" 1234567 ")).toBe(calcularDigitoVerificador("1234567"));
  });

  it("siempre devuelve un único dígito 0–9", () => {
    for (let n = 1; n <= 2000; n++) {
      const dv = calcularDigitoVerificador(String(n));
      expect(dv).toBeGreaterThanOrEqual(0);
      expect(dv).toBeLessThanOrEqual(9);
    }
  });

  it("lanza error con identificador vacío", () => {
    expect(() => calcularDigitoVerificador("")).toThrow();
    expect(() => calcularDigitoVerificador("---")).toThrow();
  });
});

describe("calcularRuc", () => {
  it("devuelve el RUC en formato CI-DV", () => {
    expect(calcularRuc("1234567")).toBe("1234567-9");
    expect(calcularRuc("4185050")).toBe("4185050-5");
  });

  it("normaliza el CI antes de calcular", () => {
    expect(calcularRuc("1.234.567")).toBe("1234567-9");
  });
});

describe("esRucValido", () => {
  it("acepta un RUC con dígito verificador correcto", () => {
    expect(esRucValido("1234567-9")).toBe(true);
    expect(esRucValido("4185050-5")).toBe(true);
  });

  it("rechaza un RUC con dígito verificador incorrecto o mal formado", () => {
    expect(esRucValido("1234567-0")).toBe(false);
    expect(esRucValido("1234567")).toBe(false);
    expect(esRucValido("1234567-99")).toBe(false);
    expect(esRucValido("")).toBe(false);
  });
});
