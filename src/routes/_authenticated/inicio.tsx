import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpenText, LogOut } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { ensureUsuario, type UsuarioPerfil } from "@/lib/ensure-usuario";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Início — Libria" },
      { name: "description", content: "Sua área logada no Libria." },
    ],
  }),
  component: InicioPage,
});

function InicioPage() {
  const navigate = useNavigate();
  const { queryClient } = Route.useRouteContext();
  const { user } = Route.useRouteContext() as unknown as {
    user: { id: string; email?: string };
  };
  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    let ativo = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!data.user) throw new Error("Sessão expirada. Entre novamente.");
        return ensureUsuario(data.user);
      })
      .then((perfil) => {
        if (ativo) setPerfil(perfil);
      })
      .catch((error) => {
        if (ativo)
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar seu perfil.",
          );
      });
    return () => {
      ativo = false;
    };
  }, []);

  async function handleSignOut() {
    setSaindo(true);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const iniciais = (perfil?.nome_exibicao ?? "?")
    .split(" ")
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background px-6">
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

        <div className="rounded-2xl border border-border bg-card/80 p-8 text-center shadow-sm backdrop-blur">
          {erro ? (
            <>
              <p role="alert" className="text-sm font-medium text-destructive">
                {erro}
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => window.location.reload()}
              >
                Tentar novamente
              </Button>
            </>
          ) : perfil ? (
            <>
              <Avatar className="mx-auto h-20 w-20 border border-border">
                {perfil.avatar_url && (
                  <AvatarImage src={perfil.avatar_url} alt={perfil.nome_exibicao} />
                )}
                <AvatarFallback className="bg-accent font-serif text-2xl text-accent-foreground">
                  {iniciais}
                </AvatarFallback>
              </Avatar>

              <h1 className="mt-6 font-serif text-3xl leading-tight text-foreground">
                Logado como{" "}
                <span className="italic">{perfil.nome_exibicao}</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                @{perfil.username}
                {user.email ? ` · ${user.email}` : ""}
              </p>

              <p className="mt-6 rounded-xl bg-secondary/70 px-4 py-3 text-xs leading-relaxed text-secondary-foreground">
                Sua estante está sendo preparada — coleção, posse e empréstimos
                chegam em breve.
              </p>

              <Button
                variant="outline"
                className="mt-8 w-full"
                onClick={handleSignOut}
                disabled={saindo}
              >
                <LogOut className="h-4 w-4" />
                {saindo ? "Saindo…" : "Sair"}
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
