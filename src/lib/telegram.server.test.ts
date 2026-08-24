import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { diasDesde, formatarDataBr } from "./telegram.server";

describe("formatarDataBr", () => {
  it("formata data ISO (YYYY-MM-DD) para DD/MM/YYYY", () => {
    expect(formatarDataBr("2026-08-24")).toBe("24/08/2026");
  });

  it("formata início de ano e fim de mês", () => {
    expect(formatarDataBr("2026-01-01")).toBe("01/01/2026");
    expect(formatarDataBr("2026-12-31")).toBe("31/12/2026");
  });

  it("preserva zeros à esquerda de dia e mês", () => {
    expect(formatarDataBr("2026-03-09")).toBe("09/03/2026");
  });
});

describe("diasDesde", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retorna 0 quando a data é hoje", () => {
    vi.setSystemTime(new Date("2026-08-24T12:00:00Z"));
    expect(diasDesde("2026-08-24")).toBe(0);
  });

  it("conta dias corridos para uma data no passado", () => {
    vi.setSystemTime(new Date("2026-08-24T12:00:00Z"));
    expect(diasDesde("2026-08-21")).toBe(3);
  });

  it("retorna 0 para uma data no futuro (nunca negativo)", () => {
    vi.setSystemTime(new Date("2026-08-24T12:00:00Z"));
    expect(diasDesde("2026-08-30")).toBe(0);
  });

  it("conta corretamente atravessando virada de mês", () => {
    vi.setSystemTime(new Date("2026-09-02T12:00:00Z"));
    expect(diasDesde("2026-08-31")).toBe(2);
  });
});
