import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface SugestaoPendente {
  id: string;
  tipo_sugestao: string;
  payload: Record<string, unknown>;
  created_at: string;
  sugerido_por: string;
  sugerido_por_nome: string | null;
  sugerido_por_username: string | null;
}

/** Lista as sugestões pendentes. Só moderadores conseguem ler (RLS + checagem explícita). */
export const listarSugestoesPendentes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SugestaoPendente[]> => {
    const { supabase, userId } = context;

    const { data: ehModerador, error: erroRole } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "moderador",
    });
    if (erroRole) throw erroRole;
    if (!ehModerador) throw new Error("Acesso restrito a moderadores.");

    const { data, error } = await supabase
      .from("sugestoes")
      .select("id, tipo_sugestao, payload, created_at, sugerido_por")
      .eq("status", "pendente")
      .order("created_at", { ascending: true });
    if (error) throw error;

    const linhas = data ?? [];
    const ids = [...new Set(linhas.map((s) => s.sugerido_por))];
    const perfis = new Map<string, { nome_exibicao: string | null; username: string | null }>();

    if (ids.length) {
      const { data: usuarios } = await supabase
        .from("usuarios")
        .select("id, nome_exibicao, username")
        .in("id", ids);
      for (const u of usuarios ?? []) {
        perfis.set(u.id, { nome_exibicao: u.nome_exibicao, username: u.username });
      }
    }

    return linhas.map((s) => ({
      id: s.id,
      tipo_sugestao: s.tipo_sugestao,
      payload: (s.payload ?? {}) as Record<string, unknown>,
      created_at: s.created_at,
      sugerido_por: s.sugerido_por,
      sugerido_por_nome: perfis.get(s.sugerido_por)?.nome_exibicao ?? null,
      sugerido_por_username: perfis.get(s.sugerido_por)?.username ?? null,
    }));
  });

function texto(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const limpo = valor.trim();
  return limpo ? limpo : null;
}

/**
 * Aprova ou rejeita uma sugestão. Ao aprovar, cria a linha real em `titulos`
 * ou `fontes` com status_curadoria = 'aprovado' antes de fechar a sugestão.
 */
export const revisarSugestao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sugestaoId: string; acao: "aprovar" | "rejeitar" }) => {
    if (!data?.sugestaoId) throw new Error("sugestaoId é obrigatório.");
    if (data.acao !== "aprovar" && data.acao !== "rejeitar") throw new Error("Ação inválida.");
    return { sugestaoId: data.sugestaoId, acao: data.acao };
  })
  .handler(async ({ data, context }): Promise<{ status: "aprovado" | "rejeitado" }> => {
    const { supabase, userId } = context;

    const { data: ehModerador, error: erroRole } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "moderador",
    });
    if (erroRole) throw erroRole;
    if (!ehModerador) throw new Error("Acesso restrito a moderadores.");

    const { data: sugestao, error: erroSugestao } = await supabase
      .from("sugestoes")
      .select("id, tipo_sugestao, payload, status, sugerido_por")
      .eq("id", data.sugestaoId)
      .maybeSingle();
    if (erroSugestao) throw erroSugestao;
    if (!sugestao) throw new Error("Sugestão não encontrada.");
    if (sugestao.status !== "pendente") throw new Error("Esta sugestão já foi revisada.");

    const novoStatus = data.acao === "aprovar" ? "aprovado" : "rejeitado";
    const payload = (sugestao.payload ?? {}) as Record<string, unknown>;

    if (data.acao === "aprovar") {
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

    return { status: novoStatus };
  });
