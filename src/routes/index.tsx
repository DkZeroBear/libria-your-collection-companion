import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Libria — em construção" },
      {
        name: "description",
        content:
          "Libria: controle sua coleção de livros, jogos e mídias. Posse, leitura, empréstimos e ranking social.",
      },
      { property: "og:title", content: "Libria — em construção" },
      {
        property: "og:description",
        content:
          "Controle sua coleção de livros, jogos e mídias. Posse, leitura, empréstimos e ranking social.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  // Sessão vive no localStorage: lê só no cliente para não quebrar a hidratação.
  const [logado, setLogado] = useState(false);
  useEffect(() => {
    let ativo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (ativo) setLogado(Boolean(data.session));
    });
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      {/* Soft ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/4 left-1/2 h-[60vh] w-[120vw] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at center, var(--accent) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Emblem: stacked spines */}
        <div className="mb-8 flex items-end gap-1.5" aria-hidden>
          <span className="block h-16 w-2.5 rounded-sm bg-primary/70" />
          <span className="block h-20 w-2.5 rounded-sm bg-primary" />
          <span className="block h-14 w-2.5 rounded-sm bg-primary/55" />
          <span className="block h-24 w-2.5 rounded-sm bg-primary/85" />
          <span className="block h-12 w-2.5 rounded-sm bg-primary/45" />
        </div>

        <h1
          className="font-serif text-6xl leading-none text-foreground sm:text-7xl"
          style={{ letterSpacing: "-0.02em" }}
        >
          Libria
        </h1>

        <p className="mt-3 text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">
          em construção
        </p>

        <p className="mt-8 max-w-xs text-balance text-base leading-relaxed text-muted-foreground">
          Seu acervo de livros, jogos e mídias — posse, leitura, empréstimos e
          ranking entre colecionadores.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4">
          <Link
            to={logado ? "/inicio" : "/auth"}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            {logado ? "Continuar para o acervo" : "Entrar ou criar conta"}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Conectando o acervo…
          </div>
        </div>
      </div>

      <footer className="absolute bottom-0 z-10 w-full px-6 pb-6 text-center text-xs text-muted-foreground/70">
        Libria · {new Date().getFullYear()}
      </footer>
    </main>
  );
}
