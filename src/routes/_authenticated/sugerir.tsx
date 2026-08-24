import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "@phosphor-icons/react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { buscarPorIsbn as buscarIsbnFn } from "@/lib/isbn.functions";
import { LoteTitulos } from "@/components/sugerir/lote-titulos";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TipoMidia {
  id: string;
  nome: string;
  nome_exibicao: string;
}

interface FonteAprovada {
  id: string;
  nome: string;
}

async function fetchCatalogo(): Promise<{ tipos: TipoMidia[]; fontes: FonteAprovada[] }> {
  const [tiposRes, fontesRes] = await Promise.all([
    supabase.from("tipos_midia").select("id, nome, nome_exibicao").eq("ativo", true).order("nome"),
    supabase.from("fontes").select("id, nome").eq("status_curadoria", "aprovado").order("nome"),
  ]);
  if (tiposRes.error) throw tiposRes.error;
  if (fontesRes.error) throw fontesRes.error;
  return { tipos: tiposRes.data ?? [], fontes: fontesRes.data ?? [] };
}

const catalogoQueryOptions = queryOptions({
  queryKey: ["catalogo-sugestao"],
  queryFn: fetchCatalogo,
});

export const Route = createFileRoute("/_authenticated/sugerir")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogoQueryOptions),
  head: () => ({
    meta: [
      { title: "Sugerir título — Libria" },
      {
        name: "description",
        content:
          "Envie um título ou uma nova coleção para a curadoria do Libria, com busca automática por ISBN.",
      },
      { property: "og:title", content: "Sugerir título — Libria" },
      {
        property: "og:description",
        content: "Sugira títulos e coleções para o acervo colaborativo do Libria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <p role="alert" className="text-sm text-destructive">
        Não foi possível carregar o formulário: {error.message}
      </p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <p className="text-sm text-muted-foreground">Página não encontrada.</p>
    </div>
  ),
  component: SugerirPage,
});

type Modo = "titulo" | "fonte";

function SugerirPage() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const { data } = useSuspenseQuery(catalogoQueryOptions);

  const tipoLivro = data.tipos.find((t) => t.nome === "livro") ?? data.tipos[0];

  const [modo, setModo] = useState<Modo>("titulo");
  const [emLote, setEmLote] = useState(false);
  const [enviando, setEnviando] = useState(false);


  // Título
  const [isbn, setIsbn] = useState("");
  const [buscandoIsbn, setBuscandoIsbn] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipoMidiaId, setTipoMidiaId] = useState<string>(tipoLivro?.id ?? "");
  const [fonteId, setFonteId] = useState<string>("nenhuma");
  const [autor, setAutor] = useState("");
  const [editora, setEditora] = useState("");
  const [ano, setAno] = useState("");

  // Fonte nova
  const [fonteNome, setFonteNome] = useState("");
  const [fonteDescricao, setFonteDescricao] = useState("");
  const [fonteTipoId, setFonteTipoId] = useState<string>(tipoLivro?.id ?? "");
  const [fonteTotal, setFonteTotal] = useState("");

  const tipoSelecionado = data.tipos.find((t) => t.id === tipoMidiaId);
  const ehJogo = tipoSelecionado?.nome === "jogo";

  async function buscarIsbn() {
    const limpo = isbn.replace(/[^0-9Xx]/g, "");
    if (!limpo) return;
    setBuscandoIsbn(true);
    try {
      const resultado = await buscarIsbnFn({ data: { isbn: limpo } });
      if (!resultado.encontrado || !resultado.dados) {
        toast.info(resultado.erro ?? "ISBN não encontrado. Preencha manualmente.");
        return;
      }
      const { titulo: t, autor: a, editora: e, ano: y } = resultado.dados;
      if (t) setTitulo(t);
      if (a) setAutor(a);
      if (e) setEditora(e);
      if (y) setAno(y);
      toast.success(
        resultado.fonte === "open_library"
          ? "Dados preenchidos via Open Library. Revise antes de enviar."
          : "Dados preenchidos via Google Books. Revise antes de enviar.",
      );
    } catch (erro) {
      console.error("[sugerir] busca por ISBN falhou", erro);
      toast.error("Não foi possível buscar o ISBN. Preencha manualmente.");
    } finally {
      setBuscandoIsbn(false);
    }
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();

    let payload: Record<string, unknown>;
    if (modo === "titulo") {
      if (!titulo.trim()) {
        toast.error("Informe o título.");
        return;
      }
      if (!tipoMidiaId) {
        toast.error("Selecione o tipo de mídia.");
        return;
      }
      payload = {
        titulo: titulo.trim(),
        tipo_midia_id: tipoMidiaId,
        fonte_id: fonteId === "nenhuma" ? null : fonteId,
        identificador_externo: isbn.trim() || null,
        fonte_validacao: isbn.trim() ? "google_books" : "manual",
        metadados: ehJogo
          ? {
              plataforma: autor.trim() || null,
              desenvolvedora: editora.trim() || null,
              ano: ano.trim() || null,
            }
          : {
              autor: autor.trim() || null,
              editora: editora.trim() || null,
              ano: ano.trim() || null,
            },
      };
    } else {
      if (!fonteNome.trim()) {
        toast.error("Informe o nome da coleção.");
        return;
      }
      payload = {
        nome: fonteNome.trim(),
        descricao: fonteDescricao.trim() || null,
        tipo_midia_id: fonteTipoId,
        total_titulos_oficial: fonteTotal.trim() ? Number(fonteTotal) : null,
      };
    }

    setEnviando(true);
    const { error } = await supabase.from("sugestoes").insert({
      tipo_sugestao: modo,
      payload: payload as never,
      sugerido_por: user.id,
      status: "pendente",
    });
    setEnviando(false);

    if (error) {
      toast.error("Não foi possível enviar sua sugestão. Tente novamente.");
      return;
    }

    toast.success("Sugestão enviada para curadoria. Você será avisado quando for revisada.");
    navigate({ to: "/inicio", search: { visao: "colecoes", filtro: "todos" } });
  }

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
          <span className="font-serif text-lg tracking-tight">Sugerir item</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 px-4 pt-6">
        <section>
          <h1 className="font-serif text-2xl leading-tight">Sugerir para o acervo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Toda sugestão passa por curadoria antes de aparecer no catálogo.
          </p>
        </section>

        <div className="inline-flex rounded-lg border border-border p-1">
          {(
            [
              { valor: "titulo", rotulo: "Título" },
              { valor: "fonte", rotulo: "Coleção" },
            ] as const
          ).map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => setModo(opcao.valor)}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                modo === opcao.valor
                  ? "border border-primary text-primary"
                  : "border border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>

        {modo === "titulo" && (
          <div className="inline-flex rounded-lg border border-border p-1">
            {(
              [
                { valor: false, rotulo: "Individual" },
                { valor: true, rotulo: "Em lote" },
              ] as const
            ).map((opcao) => (
              <button
                key={String(opcao.valor)}
                type="button"
                onClick={() => setEmLote(opcao.valor)}
                className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                  emLote === opcao.valor
                    ? "border border-primary text-primary"
                    : "border border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>
        )}

        {modo === "titulo" && emLote ? (
          <LoteTitulos
            tipos={data.tipos}
            fontes={data.fontes}
            usuarioId={user.id}
            onConcluir={() =>
              navigate({ to: "/inicio", search: { visao: "colecoes", filtro: "todos" } })
            }
          />
        ) : (
          <form onSubmit={enviar} className="space-y-4">
            {modo === "titulo" ? (

            <>
              <div className="space-y-1.5">
                <Label htmlFor="isbn">ISBN (opcional)</Label>
                <Input
                  id="isbn"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  onBlur={() => void buscarIsbn()}
                  placeholder="978..."
                  maxLength={20}
                  inputMode="numeric"
                />
                <p className="text-[11px] text-muted-foreground">
                  {buscandoIsbn
                    ? "Buscando no Google Books…"
                    : "Ao sair do campo, tentamos preencher os dados automaticamente."}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  maxLength={200}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tipo-midia">Tipo de mídia</Label>
                <Select value={tipoMidiaId} onValueChange={setTipoMidiaId}>
                  <SelectTrigger id="tipo-midia" className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.tipos.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nome_exibicao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fonte">Fonte / coleção (opcional)</Label>
                <Select value={fonteId} onValueChange={setFonteId}>
                  <SelectTrigger id="fonte" className="w-full">
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhuma">Nenhuma</SelectItem>
                    {data.fontes.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="autor">{ehJogo ? "Plataforma" : "Autor"}</Label>
                  <Input
                    id="autor"
                    value={autor}
                    onChange={(e) => setAutor(e.target.value)}
                    maxLength={160}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editora">{ehJogo ? "Desenvolvedora" : "Editora"}</Label>
                  <Input
                    id="editora"
                    value={editora}
                    onChange={(e) => setEditora(e.target.value)}
                    maxLength={160}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ano">Ano</Label>
                <Input
                  id="ano"
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="2024"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="fonte-nome">Nome da Coleção</Label>
                <Input
                  id="fonte-nome"
                  value={fonteNome}
                  onChange={(e) => setFonteNome(e.target.value)}
                  maxLength={160}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fonte-descricao">Descrição</Label>
                <Textarea
                  id="fonte-descricao"
                  value={fonteDescricao}
                  onChange={(e) => setFonteDescricao(e.target.value)}
                  rows={3}
                  maxLength={600}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fonte-tipo">Tipo de mídia predominante</Label>
                <Select value={fonteTipoId} onValueChange={setFonteTipoId}>
                  <SelectTrigger id="fonte-tipo" className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.tipos.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nome_exibicao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fonte-total">Total de títulos oficial (opcional)</Label>
                <Input
                  id="fonte-total"
                  value={fonteTotal}
                  onChange={(e) => setFonteTotal(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Ex: 12"
                />
                <p className="text-[11px] text-muted-foreground">
                  Preencha só para coleções fechadas, com número de volumes conhecido. Deixe vazio
                  para categorias abertas.
                </p>
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar para curadoria"}
          </Button>
          </form>
        )}

      </div>
    </main>
  );
}
