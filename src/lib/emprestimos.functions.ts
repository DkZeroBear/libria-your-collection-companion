import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ResultadoCobranca =
  | { status: "enviado"; cobradoEm: string }
  | { status: "sem_telegram" };

/**
 * Dispara a cobrança de um empréstimo por Telegram, no chat do dono.
 * Se o dono ainda não vinculou o Telegram, devolve `sem_telegram` para a UI
 * orientar a conexão — sem erro silencioso.
 */
export const cobrarEmprestimo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { emprestimoId: string }) => {
    if (!data?.emprestimoId) throw new Error("emprestimoId é obrigatório.");
    return { emprestimoId: data.emprestimoId };
  })
  .handler(async ({ data, context }): Promise<ResultadoCobranca> => {
    const { supabase, userId } = context;

    const { data: emprestimo, error: erroEmprestimo } = await supabase
      .from("emprestimos")
      .select(
        "id, dono_id, pego_por_nome, data_emprestimo, devolvido, titulos(titulo)",
      )
      .eq("id", data.emprestimoId)
      .eq("dono_id", userId)
      .maybeSingle();

    if (erroEmprestimo) throw erroEmprestimo;
    if (!emprestimo) throw new Error("Empréstimo não encontrado.");
    if (emprestimo.devolvido) throw new Error("Este empréstimo já foi devolvido.");

    const { data: perfil, error: erroPerfil } = await supabase
      .from("usuarios")
      .select("telegram_chat_id")
      .eq("id", userId)
      .maybeSingle();

    if (erroPerfil) throw erroPerfil;
    if (!perfil?.telegram_chat_id) return { status: "sem_telegram" };

    const { enviarMensagemTelegram, diasDesde, formatarDataBr } = await import(
      "@/lib/telegram.server"
    );

    const tituloRel = emprestimo.titulos as unknown as { titulo: string } | null;
    const nomeTitulo = tituloRel?.titulo ?? "um item da sua coleção";
    const dias = diasDesde(emprestimo.data_emprestimo);

    await enviarMensagemTelegram(
      perfil.telegram_chat_id,
      `<b>Lembrete Libria</b>\n${emprestimo.pego_por_nome} está com “${nomeTitulo}” desde ${formatarDataBr(emprestimo.data_emprestimo)}, há ${dias} ${dias === 1 ? "dia" : "dias"}.`,
    );

    const cobradoEm = new Date().toISOString();
    const { error: erroUpdate } = await supabase
      .from("emprestimos")
      .update({ ultima_cobranca_em: cobradoEm, canal_cobranca: "telegram" })
      .eq("id", emprestimo.id);

    if (erroUpdate) throw erroUpdate;

    return { status: "enviado", cobradoEm };
  });
