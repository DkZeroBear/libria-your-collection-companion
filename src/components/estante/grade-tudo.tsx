import { cn } from "@/lib/utils";
import { EstadoVazio } from "@/components/estante/estado-vazio";
import { TituloCard } from "@/components/estante/titulo-card";
import {
  FILTROS,
  type Filtro,
  type PosseColecao,
  type TituloColecao,
} from "@/components/estante/types";

export function GradeTudo({
  filtrados,
  filtro,
  onFiltro,
  posseMap,
  usuarioId,
  onMudanca,
}: {
  filtrados: TituloColecao[];
  filtro: Filtro;
  onFiltro: (novo: Filtro) => void;
  posseMap: Map<string, PosseColecao>;
  usuarioId: string;
  onMudanca: () => void;
}) {
  return (
    <section>
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            onClick={() => onFiltro(f.valor)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              filtro === f.valor
                ? "border-primary text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f.rotulo}
          </button>
        ))}
      </div>
      {filtrados.length === 0 ? (
        <div className="mt-4">
          <EstadoVazio mensagem="Nenhum título neste filtro." />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtrados.map((t) => (
            <TituloCard
              key={t.id}
              titulo={t}
              posse={posseMap.get(t.id)}
              usuarioId={usuarioId}
              onMudanca={onMudanca}
            />
          ))}
        </div>
      )}
    </section>
  );
}
