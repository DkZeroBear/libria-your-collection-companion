import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ValorPayload =
  string | number | boolean | null | ValorPayload[] | { [chave: string]: ValorPayload };

export interface SugestaoPendente {
  id: string;
  tipo_sugestao: string;
  payload: Record<string, ValorPayload>;
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
      payload: (s.payload ?? {}) as Record<string, ValorPayload>,
      created_at: s.created_at,
      sugerido_por: s.sugerido_por,
      sugerido_por_nome: perfis.get(s.sugerido_por)?.nome_exibicao ?? null,
      sugerido_por_username: perfis.get(s.sugerido_por)?.username ?? null,
    }));
  });

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
    const { aplicarRevisao, exigirModerador } = await import("./curadoria.server");
    await exigirModerador(context.supabase, context.userId);
    const status = await aplicarRevisao(
      context.supabase,
      context.userId,
      data.sugestaoId,
      data.acao,
    );
    return { status };
  });

export interface ResultadoLote {
  aprovadas: number;
  falhas: { sugestaoId: string; erro: string }[];
}

/** Aprova várias sugestões pendentes de uma vez, item a item. */
export const aprovarSugestoesEmLote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sugestaoIds: string[] }) => {
    const ids = Array.isArray(data?.sugestaoIds)
      ? [...new Set(data.sugestaoIds.filter((id) => typeof id === "string" && id))]
      : [];
    if (!ids.length) throw new Error("Selecione ao menos uma sugestão.");
    return { sugestaoIds: ids };
  })
  .handler(async ({ data, context }): Promise<ResultadoLote> => {
    const { aplicarRevisao, exigirModerador } = await import("./curadoria.server");
    await exigirModerador(context.supabase, context.userId);

    const falhas: { sugestaoId: string; erro: string }[] = [];
    let aprovadas = 0;

    for (const sugestaoId of data.sugestaoIds) {
      try {
        await aplicarRevisao(context.supabase, context.userId, sugestaoId, "aprovar");
        aprovadas += 1;
      } catch (erro) {
        falhas.push({
          sugestaoId,
          erro: erro instanceof Error ? erro.message : "Falha ao aprovar.",
        });
      }
    }

    return { aprovadas, falhas };
  });

