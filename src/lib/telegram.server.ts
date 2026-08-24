/**
 * Envio de mensagens via Telegram Bot API usando o conector gerenciado da Lovable.
 * O token do bot nunca entra no código: rota pelas chamadas pelo gateway
 * (https://connector-gateway.lovable.dev/telegram) usando LOVABLE_API_KEY +
 * TELEGRAM_API_KEY. Só roda em server functions/rotas.
 */

function gatewayBase(): string {
  return process.env["CONNECTOR_GATEWAY_BASE_URL"] ?? "https://connector-gateway.lovable.dev";
}

const GATEWAY_URL = `${gatewayBase()}/telegram`;

async function chamarGateway(method: string, corpo: unknown) {
  const lovableApiKey = process.env["LOVABLE_API_KEY"];
  const telegramApiKey = process.env["TELEGRAM_API_KEY"];
  if (!lovableApiKey) throw new Error("LOVABLE_API_KEY não está configurado.");
  if (!telegramApiKey) throw new Error("TELEGRAM_API_KEY não está configurado.");

  const resposta = await fetch(`${GATEWAY_URL}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": telegramApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corpo),
  });

  if (!resposta.ok) {
    const corpoErro = await resposta.text();
    console.error(`[telegram] ${method} falhou [${resposta.status}]: ${corpoErro}`);
    throw new Error(`Telegram respondeu ${resposta.status}: ${corpoErro}`);
  }

  const dados = (await resposta.json()) as { ok?: boolean; description?: string };
  if (!dados.ok) {
    console.error(`[telegram] resposta não ok: ${dados.description}`);
    throw new Error(dados.description ?? "Falha ao enviar mensagem no Telegram.");
  }
  return dados;
}

/**
 * Envia uma mensagem via Telegram Bot API pelo gateway gerenciado.
 */
export async function enviarMensagemTelegram(chatId: string, texto: string): Promise<void> {
  await chamarGateway("sendMessage", {
    chat_id: chatId,
    text: texto,
    parse_mode: "HTML",
  });
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
