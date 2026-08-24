import { describe, it, expect } from "vitest";
import { deriveUsername } from "./ensure-usuario";

describe("deriveUsername", () => {
  it("deriva a parte local do email em minúsculas", () => {
    expect(deriveUsername("Rodolfo@example.com")).toBe("rodolfo");
  });

  it("usa fallback 'colecionador' quando o email é undefined", () => {
    expect(deriveUsername(undefined)).toBe("colecionador");
  });

  it("usa fallback quando a parte local fica vazia após sanitização", () => {
    expect(deriveUsername("@example.com")).toBe("colecionador");
  });

  it("remove acentos (normaliza NFD e descarta marcas)", () => {
    expect(deriveUsername("joão.ça@example.com")).toBe("joao_ca");
  });

  it("substitui caracteres não alfanuméricos por underscore e colapsa underscores", () => {
    expect(deriveUsername("a.b-c+d@example.com")).toBe("a_b_c_d");
  });

  it("remove underscores das extremidades", () => {
    expect(deriveUsername(".user.@example.com")).toBe("user");
  });

  it("trunca para 20 caracteres", () => {
    expect(deriveUsername("nome-muito-longo-que-excede-o-limite@example.com")).toBe(
      "nome_muito_longo_que",
    );
  });
});
