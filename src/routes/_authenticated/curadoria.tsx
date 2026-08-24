import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, X } from "@phosphor-icons/react";
import { toast } from "sonner";

import {
  aprovarSugestoesEmLote,
  listarSugestoesPendentes,
  revisarSugestao,
  type SugestaoPendente,
} from "@/lib/curadoria.functions";
import { useEhModerador } from "@/lib/use-moderador";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";


export const Route = createFileRoute("/_authenticated/curadoria")({
  head: () => ({
    meta: [
      { title: "Curadoria — Libria" },
      {
        name: "description",
        content:
          "Fila de curadoria do Libria: revise, aprove ou rejeite sugestões de títulos e coleções.",
      },
      { property: "og:title", content: "Curadoria — Libria" },
      {
        property: "og:description",
        content: "Ferramenta de moderação do acervo colaborativo do Libria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CuradoriaPage,
});

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LinhaCampo({ chave, valor }: { chave: string; valor: unknown }) {
  if (valor === null || valor === undefined || valor === "") return null;
  const texto = typeof valor === "object" ? JSON.stringify(valor, null, 0) : String(valor);
  return (
    <div className="flex gap-2 text-xs">
      <span className="min-w-28 shrink-0 text-muted-foreground">{chave}</span>
      <span className="break-words text-foreground">{texto}</span>
    </div>
  );
}

function CuradoriaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = Route.useRouteContext();
  const ehModerador = useEhModerador(user.id);
  const [checou, setChecou] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const listar = useServerFn(listarSugestoesPendentes);
  const revisar = useServerFn(revisarSugestao);
  const aprovarLote = useServerFn(aprovarSugestoesEmLote);

  const { data: sugestoes, isLoading } = useQuery({
    queryKey: ["sugestoes-pendentes"],
    queryFn: () => listar(),
    enabled: ehModerador,
  });

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["sugestoes-pendentes"] });
    void queryClient.invalidateQueries({ queryKey: ["colecao"] });
    void queryClient.invalidateQueries({ queryKey: ["catalogo-sugestao"] });
  };

  const mutacao = useMutation({
    mutationFn: (vars: { sugestaoId: string; acao: "aprovar" | "rejeitar" }) =>
      revisar({ data: vars }),
    onSuccess: (resultado, vars) => {
      toast.success(
        resultado.status === "aprovado"
          ? "Sugestão aprovada e publicada no acervo."
          : "Sugestão rejeitada.",
      );
      setSelecionados((atual) => atual.filter((id) => id !== vars.sugestaoId));
      invalidar();
    },
    onError: (erro: Error) => toast.error(erro.message || "Não foi possível revisar a sugestão."),
  });

  const mutacaoLote = useMutation({
    mutationFn: (ids: string[]) => aprovarLote({ data: { sugestaoIds: ids } }),
    onSuccess: (resultado) => {
      if (resultado.aprovadas > 0) {
        toast.success(
          `${resultado.aprovadas} ${resultado.aprovadas === 1 ? "sugestão aprovada" : "sugestões aprovadas"}.`,
        );
      }
      if (resultado.falhas.length > 0) {
        toast.error(
          `${resultado.falhas.length} não puderam ser aprovadas: ${resultado.falhas[0]?.erro ?? ""}`,
        );
      }
      setSelecionados([]);
      invalidar();
    },
    onError: (erro: Error) => toast.error(erro.message || "Não foi possível aprovar em lote."),
  });


  // Sem papel de moderador: avisa e devolve para a estante.
  if (!ehModerador) {
    if (!checou) {
      setChecou(true);
      setTimeout(() => {
        toast.error("Área restrita à curadoria. Você não tem permissão de moderador.");
        navigate({ to: "/inicio", search: { visao: "colecoes", filtro: "todos" }, replace: true });
      }, 400);
    }
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
        <p role="alert" className="text-sm text-muted-foreground">
          Verificando permissões de curadoria…
        </p>
      </div>
    );
  }

  const lista: SugestaoPendente[] = sugestoes ?? [];
  const idsVisiveis = lista.map((s) => s.id);
  const marcados = selecionados.filter((id) => idsVisiveis.includes(id));
  const todosMarcados = lista.length > 0 && marcados.length === lista.length;
  const alternar = (id: string, marcado: boolean) =>
    setSelecionados((atual) =>
      marcado ? [...new Set([...atual, id])] : atual.filter((x) => x !== id),
    );


  return (
    <main className="min-h-[100dvh] bg-background pb-16">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link
            to="/inicio"
            search={{ visao: "colecoes", filtro: "todos" }}
            aria-label="Voltar para a estante"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ArrowLeft size={16} />
          </Link>
          <span className="font-serif text-lg tracking-tight">Curadoria</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 px-4 pt-6">
        <section>
          <h1 className="font-serif text-2xl leading-tight">Fila de curadoria</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading
              ? "Carregando sugestões…"
              : `${lista.length} ${lista.length === 1 ? "sugestão pendente" : "sugestões pendentes"}`}
          </p>
        </section>

        {!isLoading && lista.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma sugestão pendente por enquanto.
          </p>
        )}

        {!isLoading && lista.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={todosMarcados}
                onCheckedChange={(valor) => setSelecionados(valor === true ? idsVisiveis : [])}
                aria-label="Selecionar todas as sugestões"
              />
              {marcados.length > 0 ? `${marcados.length} selecionada(s)` : "Selecionar todas"}
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={marcados.length === 0 || mutacaoLote.isPending}
              onClick={() => mutacaoLote.mutate(marcados)}
            >
              <Check size={14} />
              {mutacaoLote.isPending ? "Aprovando…" : "Aprovar selecionados"}
            </Button>
          </div>
        )}

        <ul className="space-y-3">
          {lista.map((s) => {
            const emAndamento =
              (mutacao.isPending && mutacao.variables?.sugestaoId === s.id) ||
              (mutacaoLote.isPending && marcados.includes(s.id));
            return (
              <li key={s.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      className="mt-1"
                      checked={marcados.includes(s.id)}
                      onCheckedChange={(valor) => alternar(s.id, valor === true)}
                      aria-label={`Selecionar sugestão ${String(s.payload["titulo"] ?? s.payload["nome"] ?? "")}`}
                    />
                    <div>
                      <span className="rounded-md border border-border px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                        {s.tipo_sugestao === "fonte" ? "Fonte nova" : "Título"}
                      </span>
                      <p className="mt-2 font-serif text-base leading-tight">
                        {String(s.payload["titulo"] ?? s.payload["nome"] ?? "Sem nome")}
                      </p>
                    </div>
                  </div>
                </div>


                <div className="mt-3 space-y-1">
                  {Object.entries(s.payload)
                    .filter(([chave]) => chave !== "titulo" && chave !== "nome")
                    .map(([chave, valor]) => (
                      <LinhaCampo key={chave} chave={chave} valor={valor} />
                    ))}
                </div>

                <p className="mt-3 text-[11px] text-muted-foreground">
                  Sugerido por{" "}
                  {s.sugerido_por_username
                    ? `@${s.sugerido_por_username}`
                    : (s.sugerido_por_nome ?? "usuário")}{" "}
                  em {formatarData(s.created_at)}
                </p>

                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={emAndamento}
                    onClick={() => mutacao.mutate({ sugestaoId: s.id, acao: "aprovar" })}
                  >
                    <Check size={14} />
                    Aprovar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={emAndamento}
                    onClick={() => mutacao.mutate({ sugestaoId: s.id, acao: "rejeitar" })}
                  >
                    <X size={14} />
                    Rejeitar
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
