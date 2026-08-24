import { Link } from "@tanstack/react-router";
import { Gear, SignOut } from "@phosphor-icons/react";

import type { UsuarioPerfil } from "@/lib/ensure-usuario";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function CabecalhoEstante({
  perfil,
  saindo,
  onSignOut,
}: {
  perfil: UsuarioPerfil;
  saindo: boolean;
  onSignOut: () => void;
}) {
  const iniciais = perfil.nome_exibicao
    .split(" ")
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <span className="font-serif text-lg tracking-tight">Libria</span>
        <div className="flex items-center gap-2">
          <Link
            to="/sugerir"
            aria-label="Sugerir item"
            className="flex h-9 items-center gap-1 rounded-lg border border-border px-2.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Plus size={14} />
            Sugerir item
          </Link>
          <Link
            to="/configuracoes"
            aria-label="Configurações"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Gear size={16} />
          </Link>
          <ThemeToggle />
          <Avatar className="h-9 w-9 border border-border">
            {perfil.avatar_url && (
              <AvatarImage src={perfil.avatar_url} alt={perfil.nome_exibicao} />
            )}
            <AvatarFallback className="bg-accent text-xs text-accent-foreground">
              {iniciais}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={onSignOut}
            disabled={saindo}
            aria-label="Sair"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
          >
            <SignOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
