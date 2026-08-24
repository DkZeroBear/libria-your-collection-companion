import { BookOpen, Books, Heart, Package } from "@phosphor-icons/react";

import { EmprestarDialog } from "@/components/emprestar-dialog";
import { Indicador } from "@/components/estante/indicador";
import type { PosseColecao, TituloColecao } from "@/components/estante/types";

export function TituloCard({
  titulo,
  posse,
  usuarioId,
  onMudanca,
}: {
  titulo: TituloColecao;
  posse?: PosseColecao | undefined;
  usuarioId: string;
  onMudanca: () => void;
}) {
  const autor = titulo.metadados?.autor;
  return (
    <article className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-3">
      {titulo.capa_url ? (
        <img
          src={titulo.capa_url}
          alt={`Capa de ${titulo.titulo}`}
          loading="lazy"
          className="aspect-[2/3] w-full rounded-md object-cover"
        />
      ) : (
        <div className="flex aspect-[2/3] w-full items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
          <Books size={22} />
        </div>
      )}
      <div className="min-w-0">
        <h3 className="truncate text-sm font-medium leading-snug">
          {titulo.titulo}
        </h3>
        {autor && (
          <p className="truncate text-xs text-muted-foreground">{autor}</p>
        )}
      </div>
      <div className="mt-auto flex flex-wrap gap-1.5">
        <Indicador
          ativo={!!posse?.tenho}
          rotulo={posse?.tenho ? "Tenho" : "Não tenho"}
          icone={<Package size={12} />}
        />
        <Indicador
          ativo={!!posse?.lido}
          rotulo={posse?.lido ? "Lido" : "Não lido"}
          icone={<BookOpen size={12} />}
        />
        {posse?.quero && !posse?.tenho && (
          <Indicador ativo rotulo="Quero" icone={<Heart size={12} />} />
        )}
        {posse?.tenho && (
          <EmprestarDialog
            tituloId={titulo.id}
            tituloNome={titulo.titulo}
            donoId={usuarioId}
            onRegistrado={onMudanca}
          />
        )}
      </div>
    </article>
  );
}
