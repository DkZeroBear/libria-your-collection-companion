import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpenText, Loader2, MailCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Libria" },
      {
        name: "description",
        content:
          "Acesse o Libria com email e senha ou Google para controlar sua coleção de livros, jogos e mídias.",
      },
      { property: "og:title", content: "Entrar — Libria" },
      {
        property: "og:description",
        content:
          "Acesse o Libria para controlar sua coleção de livros, jogos e mídias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Modo = "entrar" | "cadastrar";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        opacity=".7"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        opacity=".5"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        opacity=".9"
      />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);

  // Retorno do OAuth (Google) ou usuário já logado: segue para a área logada.
  useEffect(() => {
    let ativo = true;
    supabase.auth.getUser().then(({ data }) => {
      if (ativo && data.user)
        navigate({
          to: "/inicio",
          search: { visao: "colecoes", filtro: "todos" },
          replace: true,
        });
    });
    return () => {
      ativo = false;
    };
  }, [navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });
        if (error) throw error;
        navigate({
          to: "/inicio",
          search: { visao: "colecoes", filtro: "todos" },
        });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          navigate({
            to: "/inicio",
            search: { visao: "colecoes", filtro: "todos" },
          });
        } else {
          // Confirmação de email habilitada: perfil é criado no primeiro login.
          setAguardandoConfirmacao(true);
        }
      }
    } catch (error) {
      setErro(traduzErro(error));
    } finally {
      setCarregando(false);
    }
  }

  async function handleGoogle() {
    setErro(null);
    setCarregando(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth` },
    });
    if (error) {
      setErro(traduzErro(error));
      setCarregando(false);
    }
    // Em caso de sucesso o navegador é redirecionado ao Google.
  }

  if (aguardandoConfirmacao) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <MailCheck className="h-6 w-6" />
          </span>
          <h1 className="mt-6 font-serif text-3xl text-foreground">
            Confira seu email
          </h1>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Enviamos um link de confirmação para{" "}
            <span className="font-medium text-foreground">{email}</span>. Clique
            nele para ativar sua conta e depois entre aqui.
          </p>
          <Button
            variant="outline"
            className="mt-8"
            onClick={() => {
              setAguardandoConfirmacao(false);
              setModo("entrar");
            }}
          >
            Voltar para entrar
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="font-serif text-4xl text-foreground">
          {modo === "entrar" ? "Bom ver você de novo" : "Comece seu acervo"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {modo === "entrar"
            ? "Entre para acessar sua coleção."
            : "Crie sua conta para catalogar livros, jogos e mídias."}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 rounded-full border border-border bg-secondary/60 p-1 text-sm font-medium">
        {(["entrar", "cadastrar"] as const).map((opcao) => (
          <button
            key={opcao}
            type="button"
            onClick={() => {
              setModo(opcao);
              setErro(null);
            }}
            className={`rounded-full px-3 py-2 transition-colors ${
              modo === opcao
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opcao === "entrar" ? "Entrar" : "Cadastrar"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-card"
          />
        </div>
        <div className="space-y-2 text-left">
          <Label htmlFor="senha">Senha</Label>
          <Input
            id="senha"
            type="password"
            required
            minLength={6}
            autoComplete={
              modo === "entrar" ? "current-password" : "new-password"
            }
            placeholder="Mínimo de 6 caracteres"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="bg-card"
          />
        </div>

        {erro && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {erro}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={carregando}>
          {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
          {modo === "entrar" ? "Entrar" : "Criar conta"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full bg-card"
        onClick={handleGoogle}
        disabled={carregando}
      >
        <GoogleIcon />
        Continuar com Google
      </Button>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/4 left-1/2 h-[60vh] w-[120vw] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at center, var(--accent) 0%, transparent 65%)",
        }}
      />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpenText className="h-5 w-5" />
          </span>
          <span className="mt-3 font-serif text-xl text-foreground">
            Libria
          </span>
        </div>
        <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}

function traduzErro(error: unknown): string {
  const message =
    error instanceof Error ? error.message : "Erro inesperado. Tente novamente.";
  if (message.includes("Invalid login credentials"))
    return "Email ou senha incorretos.";
  if (message.includes("User already registered"))
    return "Este email já tem uma conta. Tente entrar.";
  if (message.includes("Password should be"))
    return "A senha precisa ter pelo menos 6 caracteres.";
  if (message.includes("Unable to validate email"))
    return "Email inválido. Confira e tente novamente.";
  if (message.includes("provider is not enabled"))
    return "Login com Google ainda não está ativado no Supabase.";
  return message;
}
