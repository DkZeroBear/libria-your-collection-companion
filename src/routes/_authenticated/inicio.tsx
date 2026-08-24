import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Books,
  Gear,
  Heart,
  Package,
  SignOut,
} from "@phosphor-icons/react";

import { supabase } from "@/integrations/supabase/client";
import { ensureUsuario } from "@/lib/ensure-usuario";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { EmprestarDialog } from "@/components/emprestar-dialog";
import {
  EmprestimosBloco,
  type EmprestimoAtivo,
} from "@/components/emprestimos-bloco";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Visao = "colecoes" | "tudo";
type Filtro = "todos" | "tenho" | "faltam" | "lidos" | "quero";

interface TituloColecao {
  id: string;
  titulo: string;
  capa_url: string | null;
  metadados: { autor?: string; editora?: string; ano?: string | number } | null;
  fonte_id: string | null;
  fontes: {
    id: string;
    nome: string;
    total_titulos_oficial: number | null;
  } | null;
}

interface PosseColecao {
  titulo_id: string;
  tenho: boolean;
  lido: boolean;
  quero: boolean;
}

interface ColecaoDados {
  titulos: TituloColecao[];
  posses: PosseColecao[];
  emprestimos: EmprestimoAtivo[];
}

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "tenho", rotulo: "Tenho" },
  { valor: "faltam", rotulo: "Faltam" },
  { valor: "lidos", rotulo: "Lidos" },
  { valor: "quero", rotulo: "Quero" },
];

async function fetchColecao(usuarioId: string): Promise<ColecaoDados> {
  const [titulosRes, possesRes, emprestimosRes] = await Promise.all([
    supabase
      .from("titulos")
      .select(
        "id, titulo, capa_url, metadados, fonte_id, fontes(id, nome, total_titulos_oficial)",
      )
      .eq("status_curadoria", "aprovado")
      .order("titulo"),
    supabase
      .from("posse")
      .select("titulo_id, tenho, lido, quero")
      .eq("usuario_id", usuarioId),
    supabase
      .from("emprestimos")
      .select(
        "id, pego_por_nome, data_emprestimo, data_devolucao_prevista, ultima_cobranca_em, titulos(titulo)",
      )
      .eq("dono_id", usuarioId)
      .eq("devolvido", false),
  ]);

  if (titulosRes.error) throw titulosRes.error;
  if (possesRes.error) throw possesRes.error;
  if (emprestimosRes.error) throw emprestimosRes.error;

  return {
    titulos: (titulosRes.data ?? []) as unknown as TituloColecao[],
    posses: possesRes.data ?? [],
    emprestimos: (emprestimosRes.data ?? []) as unknown as EmprestimoAtivo[],
  };
}

const colecaoQueryOptions = (usuarioId: string) =>
  queryOptions({
    queryKey: ["colecao", usuarioId],
    queryFn: () => fetchColecao(usuarioId),
  });

export const Route = createFileRoute("/_authenticated/inicio")({
  validateSearch: (search: Record<string, unknown>) => ({
    visao: (search["visao"] === "tudo" ? "tudo" : "colecoes") as Visao,
    filtro: (
      ["todos", "tenho", "faltam", "lidos", "quero"].includes(
        String(search["filtro"]),
      )
        ? String(search["filtro"])
        : "todos"
    ) as Filtro,
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(colecaoQueryOptions(context.user.id)),
  head: () => ({
    meta: [
      { title: "Minha coleção — Libria" },
      {
        name: "description",
        content:
          "Sua coleção no Libria: posse, leitura, completude por coleção e empréstimos.",
      },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <p role="alert" className="text-sm text-destructive">
        Não foi possível carregar sua coleção: {error.message}
      </p>
    </div>
  ),
  component: InicioPage,
});

function InicioPage() {
  const navigate = useNavigate();
  const { queryClient, user } = Route.useRouteContext();
  const { visao, filtro } = Route.useSearch();
  const [saindo, setSaindo] = useState(false);

  const { data: perfil } = useSuspenseQuery({
    queryKey: ["perfil", user.id],
    queryFn: () => ensureUsuario(user),
  });
  const { data } = useSuspenseQuery(colecaoQueryOptions(user.id));

  const posseMap = useMemo(
    () => new Map(data.posses.map((p) => [p.titulo_id, p])),
    [data.posses],
  );

  const stats = useMemo(
    () => ({
      tenho: data.posses.filter((p) => p.tenho).length,
      lidos: data.posses.filter((p) => p.lido).length,
      quero: data.posses.filter((p) => p.quero).length,
    }),
    [data.posses],
  );

  const grupos = useMemo(() => {
    const mapa = new Map<
      string,
      { nome: string; totalOficial: number | null; itens: TituloColecao[] }
    >();
    for (const t of data.titulos) {
      const chave = t.fontes?.id ?? "avulsos";
      const grupo = mapa.get(chave) ?? {
        nome: t.fontes?.nome ?? "Avulsos",
        totalOficial: t.fontes?.total_titulos_oficial ?? null,
        itens: [],
      };
      grupo.itens.push(t);
      mapa.set(chave, grupo);
    }
    return [...mapa.values()];
  }, [data.titulos]);

  const filtrados = useMemo(() => {
    if (filtro === "todos") return data.titulos;
    return data.titulos.filter((t) => {
      const p = posseMap.get(t.id);
      switch (filtro) {
        case "tenho":
          return !!p?.tenho;
        case "faltam":
          return !p?.tenho;
        case "lidos":
          return !!p?.lido;
        case "quero":
          return !!p?.quero;
      }
    });
  }, [data.titulos, filtro, posseMap]);

  function recarregar() {
    void queryClient.invalidateQueries({ queryKey: ["colecao", user.id] });
  }

  async function handleSignOut() {
    setSaindo(true);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function setVisao(nova: Visao) {
    navigate({ to: "/inicio", search: { visao: nova, filtro } });
  }

  function setFiltro(novo: Filtro) {
    navigate({ to: "/inicio", search: { visao, filtro: novo } });
  }

  const iniciais = perfil.nome_exibicao
    .split(" ")
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="min-h-[100dvh] bg-background pb-24">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <span className="font-serif text-lg tracking-tight">Libria</span>
          <div className="flex items-center gap-2">
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
              onClick={handleSignOut}
              disabled={saindo}
              aria-label="Sair"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
            >
              <SignOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-8 px-4 pt-6">
        <section>
          <h1 className="font-serif text-2xl leading-tight">
            Acervo de {perfil.nome_exibicao}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            @{perfil.username}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatChip rotulo={`${stats.tenho} na estante`} />
            <StatChip rotulo={`${stats.lidos} lidos`} />
            <StatChip rotulo={`${stats.quero} na lista de desejos`} />
          </div>
        </section>

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
              onClick={() => setVisao(valor)}
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

        {visao === "colecoes" ? (
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
                        usuarioId={user.id}
                        onMudanca={recarregar}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        ) : (
          <section>
            <div className="flex flex-wrap gap-2">
              {FILTROS.map((f) => (
                <button
                  key={f.valor}
                  type="button"
                  onClick={() => setFiltro(f.valor)}
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
                    usuarioId={user.id}
                    onMudanca={recarregar}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <EmprestimosBloco
          emprestimos={data.emprestimos}
          onMudanca={recarregar}
        />
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2.5">
          <span className="text-[11px] text-muted-foreground">
            Libria — acervo pessoal
          </span>
          <FeedbackDialog usuarioId={user.id} />
        </div>
      </footer>
    </main>
  );
}

function StatChip({ rotulo }: { rotulo: string }) {
  return (
    <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
      {rotulo}
    </span>
  );
}

function EstadoVazio({ mensagem }: { mensagem: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
      <Books size={18} className="shrink-0" />
      {mensagem}
    </div>
  );
}

function Indicador({
  ativo,
  rotulo,
  icone,
}: {
  ativo: boolean;
  rotulo: string;
  icone: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
        ativo
          ? "border-primary text-primary"
          : "border-border text-muted-foreground",
      )}
    >
      {icone}
      {rotulo}
    </span>
  );
}

function TituloCard({
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
