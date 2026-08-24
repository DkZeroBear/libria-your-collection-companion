import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";

interface TelegramUpdate {
  message?: {
    chat?: { id?: number };
    text?: string;
  };
  edited_message?: {
    chat?: { id?: number };
    text?: string;
  };
}

function gatewayBase(): string {
  return process.env["CONNECTOR_GATEWAY_BASE_URL"] ?? "https://connector-gateway.lovable.dev";
}

const GATEWAY_URL = `${gatewayBase()}/telegram`;

/**
 * Deriva o secret_token do webhook a partir da chave de conexão do Telegram.
 * O mesmo valor é registrado no setWebhook e verificado aqui na entrada.
 */
function derivarSecretWebhook(telegramApiKey: string): string {
  return createHash("sha256").update(`telegram-webhook:${telegramApiKey}`).digest("base64url");
}

function igualSeguro(a: string, b: string): boolean {
  const esq = Buffer.from(a);
  const dir = Buffer.from(b);
  return esq.length === dir.length && timingSafeEqual(esq, dir);
}

async function responder(chatId: number, texto: string) {
  const lovableApiKey = process.env["LOVABLE_API_KEY"];
  const telegramApiKey = process.env["TELEGRAM_API_KEY"];
  if (!lovableApiKey || !telegramApiKey) return;
  await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": telegramApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, text: texto }),
  });
}

/**
 * Webhook do bot do Telegram. Verifica o secret_token derivado da chave de
 * conexão, reconhece `/vincular CODIGO` e grava o chat_id no perfil
 * correspondente (service role: o webhook não tem sessão de usuário).
 */
export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const telegramApiKey = process.env["TELEGRAM_API_KEY"];
        if (!telegramApiKey) {
          console.error("[telegram webhook] TELEGRAM_API_KEY ausente");
          return new Response("Serviço indisponível", { status: 503 });
        }

        const secretEsperado = derivarSecretWebhook(telegramApiKey);
        const secretRecebido = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
        if (!igualSeguro(secretRecebido, secretEsperado)) {
          return new Response("Unauthorized", { status: 401 });
        }

        let update: TelegramUpdate;
        try {
          update = (await request.json()) as TelegramUpdate;
        } catch {
          return Response.json({ ok: true, ignored: true });
        }

        const mensagem = update.message ?? update.edited_message;
        const chatId = mensagem?.chat?.id;
        const texto = (mensagem?.text ?? "").trim();
        if (!chatId) return Response.json({ ok: true, ignored: true });

        if (/^\/start\b/.test(texto)) {
          await responder(
            chatId,
            "Olá! Envie /vincular SEUCODIGO (o código aparece em Configurações no Libria) para conectar sua conta.",
          );
          return Response.json({ ok: true });
        }

        const match = texto.match(/^\/vincular\s+([A-Za-z0-9]{4,12})$/);
        if (!match) {
          await responder(chatId, "Comando não reconhecido. Use: /vincular SEUCODIGO");
          return Response.json({ ok: true });
        }

        const codigo = match[1]!.toUpperCase();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data, error } = await supabaseAdmin
          .from("usuarios_telegram")
          .update({ telegram_chat_id: String(chatId) })
          .eq("telegram_codigo_vinculo", codigo)
          .select("usuario_id, usuarios(nome_exibicao)")
          .maybeSingle();

        if (error) {
          console.error("[telegram webhook] erro ao vincular:", error.message);
          await responder(chatId, "Erro ao vincular. Tente novamente em instantes.");
          return Response.json({ ok: false }, { status: 500 });
        }

        if (!data) {
          await responder(chatId, "Código inválido. Confira em Configurações no Libria.");
          return Response.json({ ok: true });
        }

        await responder(
          chatId,
          `Pronto, ${(data.usuarios as unknown as { nome_exibicao: string } | null)?.nome_exibicao ?? "colecionador"}! Sua conta do Libria está conectada. Você vai receber aqui os lembretes de empréstimo.`,
        );
        return Response.json({ ok: true });
      },
    },
  },
});
