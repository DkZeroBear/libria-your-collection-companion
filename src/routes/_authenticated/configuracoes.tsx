import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Copy, TelegramLogo } from "@phosphor-icons/react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

const BOT_USERNAME =
  (import.meta.env["VITE_TELEGRAM_BOT_USERNAME"] as string | undefined) ?? "LibriaAppBot";

interface PerfilTelegram {
  nome_exibicao: string;
  telegram_chat_id: string | null;
  telegram_codigo_vinculo: string;
}

const perfilQueryOptions = (usuarioId: string) =>
  queryOptions({
    queryKey: ["perfil-telegram", usuarioId],
    queryFn: async (): Promise<PerfilTelegram> => {
      const { data: perfil, error: erroPerfil } = await supabase
        .from("usuarios")
        .select("nome_exibicao")
        .eq("id", usuarioId)
        .single();
      if (erroPerfil) throw erroPerfil;

      const { data: tg, error: erroTg } = await supabase
        .from("usuarios_telegram")
        .select("telegram_chat_id, telegram_codigo_vinculo")
        .eq("usuario_id", usuarioId)
        .maybeSingle();
      if (erroTg) throw erroTg;

      if (tg) return { nome_exibicao: perfil.nome_exibicao, ...tg };

      const { data: criado, error: erroCriar } = await supabase
        .from("usuarios_telegram")
        .insert({ usuario_id: usuarioId })
        .select("telegram_chat_id, telegram_codigo_vinculo")
        .single();
      if (erroCriar) throw erroCriar;
      return { nome_exibicao: perfil.nome_exibicao, ...criado };
    },
  });

export const Route = createFileRoute("/_authenticated/configuracoes")({
  loader: ({ context }) => context.queryClient.ensureQueryData(perfilQueryOptions(context.user.id)),
  head: () => ({
    meta: [
      { title: "Configurações — Libria" },
      {
        name: "description",
        content:
          "Conecte seu Telegram ao Libria para receber lembretes de empréstimos da sua coleção.",
      },
      { property: "og:title", content: "Configurações — Libria" },
      {
        property: "og:description",
        content: "Conecte o Telegram e receba lembretes dos seus empréstimos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <p role="alert" className="text-sm text-destructive">
        Não foi possível carregar suas configurações: {error.message}
      </p>
    </div>
  ),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const { user } = Route.useRouteContext();
  const { data: perfil } = useSuspenseQuery(perfilQueryOptions(user.id));
  const comando = `/vincular ${perfil.telegram_codigo_vinculo}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(comando);
      toast.success("Comando copiado.");
    } catch {
      toast.error("Copie manualmente o comando abaixo.");
    }
  }

  return (
    <main className="min-h-[100dvh] bg-background pb-16">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link
            to="/inicio"
            search={{ visao: "colecoes", filtro: "todos" }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft size={16} />
            Coleção
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-8 px-4 pt-6">
        <section>
          <h1 className="font-serif text-2xl leading-tight">Configurações</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ajustes da sua conta no Libria.</p>
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <TelegramLogo size={18} className="text-primary" />
            <h2 className="font-serif text-lg">Telegram</h2>
          </div>

          {perfil.telegram_chat_id ? (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary px-3 py-1 text-xs text-primary">
              <CheckCircle size={14} />
              Conta conectada — lembretes ativos
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Conecte o Telegram para receber os lembretes de empréstimo quando usar “Cobrar”.
              </p>
              <ol className="mt-4 space-y-3 text-sm">
                <li className="flex gap-2">
                  <span className="text-muted-foreground">1.</span>
                  <span>
                    Abra uma conversa com{" "}
                    <a
                      href={`https://t.me/${BOT_USERNAME}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline underline-offset-4"
                    >
                      @{BOT_USERNAME}
                    </a>{" "}
                    no Telegram e toque em “Iniciar”.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground">2.</span>
                  <span>Envie o comando abaixo para o bot:</span>
                </li>
              </ol>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-border px-3 py-2 font-mono text-sm">
                  {comando}
                </code>
                <button
                  type="button"
                  onClick={copiar}
                  aria-label="Copiar comando"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Copy size={16} />
                </button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Depois de vincular, recarregue esta página para ver a conexão confirmada.
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
