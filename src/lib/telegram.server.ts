const TELEGRAM_API = "https://api.telegram.org";

/**
 * Envia uma mensagem via Telegram Bot API usando o secret TELEGRAM_BOT_TOKEN.
 * Nunca expõe o token para o cliente: só roda em server functions/rotas.
 */
export async function enviarMensagemTelegram(
  chatId: string,
  texto: string,
): Promise<void> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN não está configurado.");

  const resposta = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: texto,
      parse_mode: "HTML",
    }),
  });

  if (!resposta.ok) {
    const corpo = await resposta.text();
    console.error(`[telegram] sendMessage falhou [${resposta.status}]: ${corpo}`);
    throw new Error(`Telegram respondeu ${resposta.status}: ${corpo}`);
  }

  const dados = (await resposta.json()) as { ok?: boolean; description?: string };
  if (!dados.ok) {
    console.error(`[telegram] resposta não ok: ${dados.description}`);
    throw new Error(dados.description ?? "Falha ao enviar mensagem no Telegram.");
  }
}

export function diasDesde(dataIso: string): number {
  const inicio = new Date(`${dataIso}T12:00:00Z`).getTime();
  const hoje = Date.now();
  return Math.max(0, Math.floor((hoje - inicio) / 86_400_000));
}

export function formatarDataBr(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split("-");
  return `${dia}/${mes}/${ano}`;
}
