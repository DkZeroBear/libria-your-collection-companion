import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export type ValorPayloadServer =
  | string
  | number
  | boolean
  | null
  | ValorPayloadServer[]
  | { [chave: string]: ValorPayloadServer };

function texto(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const limpo = valor.trim();
  return limpo ? limpo : null;
}

/** Garante que o usuário atual é moderador. Lança erro caso contrário. */
export async function exigirModerador(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { data: ehModerador, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "moderador",
  });
  if (error) throw error;
  if (!ehModerador) throw new Error("Acesso restrito a moderadores.");
}

/**
 * Aplica a revisão de uma sugestão pendente: ao aprovar cria a linha real em
 * `titulos`/`fontes`, e sempre fecha a sugestão com os campos de revisão.
 */
export async function aplicarRevisao(
  supabase: SupabaseClient<Database>,
  userId: string,
  sugestaoId: string,
  acao: "aprovar" | "rejeitar",
): Promise<"aprovado" | "rejeitado"> {
  const { data: sugestao, error: erroSugestao } = await supabase
    .from("sugestoes")
    .select("id, tipo_sugestao, payload, status, sugerido_por")
    .eq("id", sugestaoId)
    .maybeSingle();
  if (erroSugestao) throw erroSugestao;
  if (!sugestao) throw new Error("Sugestão não encontrada.");
  if (sugestao.status !== "pendente") throw new Error("Esta sugestão já foi revisada.");

  const novoStatus = acao === "aprovar" ? "aprovado" : "rejeitado";
  const payload = (sugestao.payload ?? {}) as Record<string, ValorPayloadServer>;

  if (acao === "aprovar") {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (sugestao.tipo_sugestao === "titulo") {
      const titulo = texto(payload["titulo"]);
      const tipoMidiaId = texto(payload["tipo_midia_id"]);
      if (!titulo || !tipoMidiaId) throw new Error("Sugestão de título incompleta.");

      const { error } = await supabaseAdmin.from("titulos").insert({
        titulo,
        tipo_midia_id: tipoMidiaId,
        fonte_id: texto(payload["fonte_id"]),
        capa_url: texto(payload["capa_url"]),
        metadados: (payload["metadados"] ?? {}) as never,
        fonte_validacao: texto(payload["fonte_validacao"]) ?? "manual",
        identificador_externo: texto(payload["identificador_externo"]),
        status_curadoria: "aprovado",
        criado_por: sugestao.sugerido_por,
      });
      if (error) throw error;
    } else if (sugestao.tipo_sugestao === "fonte") {
      const nome = texto(payload["nome"]);
      const tipoMidiaId = texto(payload["tipo_midia_id"]);
      if (!nome || !tipoMidiaId) throw new Error("Sugestão de fonte incompleta.");

      const total = payload["total_titulos_oficial"];
      const { error } = await supabaseAdmin.from("fontes").insert({
        nome,
        descricao: texto(payload["descricao"]),
        capa_url: texto(payload["capa_url"]),
        tipo_midia_id: tipoMidiaId,
        total_titulos_oficial: typeof total === "number" ? total : null,
        status_curadoria: "aprovado",
        criado_por: sugestao.sugerido_por,
      });
      if (error) throw error;
    } else {
      throw new Error("Tipo de sugestão desconhecido.");
    }
  }

  const { error: erroUpdate } = await supabase
    .from("sugestoes")
    .update({
      status: novoStatus,
      revisado_por: userId,
      revisado_em: new Date().toISOString(),
    })
    .eq("id", sugestao.id);
  if (erroUpdate) throw erroUpdate;

  return novoStatus;
}
