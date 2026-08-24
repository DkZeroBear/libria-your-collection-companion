import { cn } from "@/lib/utils";
import type { Visao } from "@/components/estante/types";

export function SeletorVisao({
  visao,
  onChange,
}: {
  visao: Visao;
  onChange: (nova: Visao) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Forma de visualizar a coleção"
      className="flex gap-1 rounded-lg border border-border p-1"
    >
      {(
        [
          ["colecoes", "Por coleção"],
          ["tudo", "Tudo"],
        ] as const
      ).map(([valor, rotulo]) => (
        <button
          key={valor}
          type="button"
          role="tab"
          aria-selected={visao === valor}
          onClick={() => onChange(valor)}
          className={cn(
            "flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors",
            visao === valor
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {rotulo}
        </button>
      ))}
    </div>
  );
}
