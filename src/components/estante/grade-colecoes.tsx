import { EstadoVazio } from "@/components/estante/estado-vazio";
import { TituloCard } from "@/components/estante/titulo-card";
import type { GrupoColecao, PosseColecao } from "@/components/estante/types";

export function GradeColecoes({
  grupos,
  posseMap,
  usuarioId,
  onMudanca,
}: {
  grupos: GrupoColecao[];
  posseMap: Map<string, PosseColecao>;
  usuarioId: string;
  onMudanca: () => void;
}) {
  return (
    <section className="space-y-10">
      {grupos.length === 0 && (
        <EstadoVazio mensagem="Nenhum título aprovado no catálogo ainda." />
      )}
      {grupos.map((grupo) => {
        // Categoria aberta por padrão: só coleções com total oficial
        // declarado exibem completude.
        const fechada =
          typeof grupo.totalOficial === "number" && grupo.totalOficial > 0;
        const total = fechada ? grupo.totalOficial! : grupo.itens.length;
        const tenho = grupo.itens.filter(
          (t) => posseMap.get(t.id)?.tenho,
        ).length;
        const pct = total > 0 ? Math.round((tenho / total) * 100) : 0;
        return (
          <div key={grupo.nome}>
            <div className="flex items-baseline justify-between gap-3">
              {fechada ? (
                <h2 className="font-serif text-lg">{grupo.nome}</h2>
              ) : (
                <h2 className="inline-flex rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                  {grupo.nome}
                </h2>
              )}
              <span className="text-xs text-muted-foreground">
                {fechada
                  ? `${tenho} de ${total} · ${pct}%`
                  : `${grupo.itens.length} ${grupo.itens.length === 1 ? "título" : "títulos"}`}
              </span>
            </div>
            {fechada && (
              <div
                className="mt-2 h-1 overflow-hidden rounded-full border border-border"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Completude de ${grupo.nome}`}
              >
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {grupo.itens.map((t) => (
                <TituloCard
                  key={t.id}
                  titulo={t}
                  posse={posseMap.get(t.id)}
                  usuarioId={usuarioId}
                  onMudanca={onMudanca}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
