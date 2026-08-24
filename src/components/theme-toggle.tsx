import { useEffect, useState } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

import { useTheme } from "@/lib/theme";

/**
 * Alterna entre o tema claro (papel creme) e o Nocturne (escuro).
 * A escolha é persistida em localStorage pelo useTheme.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [montado, setMontado] = useState(false);

  // Evita mismatch de hidratação: o ícone depende do localStorage,
  // que só existe no cliente.
  useEffect(() => setMontado(true), []);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
    >
      {montado ? (
        theme === "dark" ? (
          <Sun size={16} />
        ) : (
          <Moon size={16} />
        )
      ) : (
        <span className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
