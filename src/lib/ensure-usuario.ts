import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export interface UsuarioPerfil {
  id: string;
  username: string;
  nome_exibicao: string;
  avatar_url: string | null;
}

function deriveUsername(email: string | undefined): string {
  const base = (email?.split("@")[0] ?? "colecionador")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
  return base || "colecionador";
}

/**
 * Garante que existe uma linha em `usuarios` para o usuário autenticado.
 * Cria o perfil no primeiro acesso (qualquer método de login), com
 * perfil_publico = true (default do banco) e username derivado do email.
 */
export async function ensureUsuario(user: User): Promise<UsuarioPerfil> {
  const { data: existing, error: selectError } = await supabase
    .from("usuarios")
    .select("id, username, nome_exibicao, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing;

  const base = deriveUsername(user.email);
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName = metadata["full_name"];
  const name = metadata["name"];
  const avatar = metadata["avatar_url"];
  const nomeExibicao =
    (typeof fullName === "string" && fullName) ||
    (typeof name === "string" && name) ||
    base;
  const avatarUrl = typeof avatar === "string" ? avatar : null;

  // Username é unique: em caso de colisão, tenta com sufixo aleatório.
  for (let attempt = 0; attempt < 5; attempt++) {
    const username =
      attempt === 0
        ? base
        : `${base}_${Math.random().toString(36).slice(2, 6)}`;

    const { data, error } = await supabase
      .from("usuarios")
      .insert({
        id: user.id,
        username,
        nome_exibicao: nomeExibicao,
        avatar_url: avatarUrl,
        perfil_publico: true,
      })
      .select("id, username, nome_exibicao, avatar_url")
      .single();

    if (!error) return data;
    if (error.code !== "23505") throw error;

    // Conflito pode ser corrida de outra chamada que já criou o perfil
    // (PK id) — nesse caso, apenas devolve a linha existente.
    const { data: corrida } = await supabase
      .from("usuarios")
      .select("id, username, nome_exibicao, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    if (corrida) return corrida;
    // Senão, foi colisão de username: tenta de novo com sufixo.
  }

  throw new Error("Não foi possível criar seu perfil. Tente novamente.");
}
