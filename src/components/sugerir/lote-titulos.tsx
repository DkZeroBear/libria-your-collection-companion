import { useState } from "react";
import { toast } from "sonner";
import { Trash } from "@phosphor-icons/react";

import { supabase } from "@/integrations/supabase/client";
import { buscarPorIsbnLote } from "@/lib/isbn.functions";

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

export interface TipoMidiaLote {
  id: string;
  nome: string;
  nome_exibicao: string;
}

export interface FonteLote {
  id: string;
  nome: string;
}

export interface ItemLote {
  chave: string;
  isbn: string;
  titulo: string;
  autor: string;
  editora: string;
  ano: string;
  origem: "busca" | "manual" | "nao_encontrado";
}

const MODELO_CSV =
  "isbn,titulo,autor,editora,ano\n" +
  "9788535902778,,,,\n" +
  ",Dom Casmurro,Machado de Assis,Editora Exemplo,1899\n" +
  "9788533615540,Neuromancer,,,\n";

function dividirLinhaCsv(linha: string): string[] {
  const campos: string[] = [];
  let atual = "";
  let entreAspas = false;
  for (let i = 0; i < linha.length; i += 1) {
    const c = linha[i];
    if (c === '"') {
      if (entreAspas && linha[i + 1] === '"') {
        atual += '"';
        i += 1;
      } else {
        entreAspas = !entreAspas;
      }
    } else if (c === "," && !entreAspas) {
      campos.push(atual);
      atual = "";
    } else {
      atual += c;
    }
  }
  campos.push(atual);
  return campos.map((c) => c.trim());
}

function ehSomenteIsbn(valor: string): boolean {
  return /^[0-9Xx-]{10,17}$/.test(valor.replace(/\s/g, ""));
}

function normalizarIsbn(valor: string): string {
  return valor.replace(/[^0-9Xx]/g, "").toUpperCase();
}

function linhasDoTexto(texto: string): ItemLote[] {
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((linha, indice) => {
      if (ehSomenteIsbn(linha)) {
        return {
          chave: `t-${indice}`,
          isbn: normalizarIsbn(linha),
          titulo: "",
          autor: "",
          editora: "",
          ano: "",
          origem: "manual" as const,
        };
      }
      const partes = linha.split("|").map((p) => p.trim());
      return {
        chave: `t-${indice}`,
        isbn: "",
        titulo: partes[0] ?? "",
        autor: partes[1] ?? "",
        editora: partes[2] ?? "",
        ano: partes[3] ?? "",
        origem: "manual" as const,
      };
    });
}

function linhasDoCsv(conteudo: string): ItemLote[] {
  const linhas = conteudo
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (linhas.length === 0) return [];

  const primeira = dividirLinhaCsv(linhas[0]!).map((c) => c.toLowerCase());
  const temCabecalho = primeira.includes("isbn") || primeira.includes("titulo");
  const colunas = temCabecalho ? primeira : ["isbn", "titulo", "autor", "editora", "ano"];
  const corpo = temCabecalho ? linhas.slice(1) : linhas;

  const indiceDe = (nome: string) => colunas.indexOf(nome);

  return corpo.map((linha, indice) => {
    const campos = dividirLinhaCsv(linha);
    const pegar = (nome: string) => {
      const i = indiceDe(nome);
      return i >= 0 ? (campos[i] ?? "") : "";
    };
    return {
      chave: `c-${indice}`,
      isbn: normalizarIsbn(pegar("isbn")),
      titulo: pegar("titulo"),
      autor: pegar("autor"),
      editora: pegar("editora"),
      ano: pegar("ano"),
      origem: "manual" as const,
    };
  });
}

interface Props {
  tipos: TipoMidiaLote[];
  fontes: FonteLote[];
  usuarioId: string;
  onConcluir: () => void;
}

export function LoteTitulos({ tipos, fontes, usuarioId, onConcluir }: Props) {
  const tipoLivro = tipos.find((t) => t.nome === "livro") ?? tipos[0];

  const [entrada, setEntrada] = useState<"texto" | "csv">("texto");
  const [texto, setTexto] = useState("");
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [itens, setItens] = useState<ItemLote[] | null>(null);
  const [processando, setProcessando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [tipoMidiaId, setTipoMidiaId] = useState(tipoLivro?.id ?? "");
  const [fonteId, setFonteId] = useState("nenhuma");

  const ehJogo = tipos.find((t) => t.id === tipoMidiaId)?.nome === "jogo";

  function baixarModelo() {
    const blob = new Blob([MODELO_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo-libria.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function processar(brutos: ItemLote[]) {
    if (brutos.length === 0) {
      toast.error("Nenhuma linha válida encontrada.");
      return;
    }
    setProcessando(true);
    try {
      const isbns = brutos.map((i) => i.isbn).filter(Boolean);
      const resultados = isbns.length
        ? await buscarPorIsbnLote({ data: { isbns } })
        : ({} as Record<string, { encontrado: boolean; dados?: Record<string, string> }>);

      const processados = brutos.map((item) => {
        if (!item.isbn) return item;
        const resultado = resultados[item.isbn];
        if (resultado?.encontrado && resultado.dados) {
          const d = resultado.dados as Record<string, string | undefined>;
          return {
            ...item,
            titulo: d["titulo"] ?? item.titulo,
            autor: d["autor"] ?? item.autor,
            editora: d["editora"] ?? item.editora,
            ano: d["ano"] ?? item.ano,
            origem: "busca" as const,
          };
        }
        return { ...item, origem: (item.titulo ? "manual" : "nao_encontrado") as ItemLote["origem"] };
      });

      setItens(processados);
      const achados = processados.filter((i) => i.origem === "busca").length;
      toast.success(`${processados.length} linhas processadas · ${achados} preenchidas pela busca.`);
    } catch (erro) {
      console.error("[lote] processamento falhou", erro);
      toast.error("Não foi possível processar o lote. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  }

  async function lerCsv(arquivo: File) {
    const conteudo = await arquivo.text();
    setNomeArquivo(arquivo.name);
    await processar(linhasDoCsv(conteudo));
  }

  function atualizar(chave: string, campo: keyof ItemLote, valor: string) {
    setItens((atuais) =>
      (atuais ?? []).map((i) => (i.chave === chave ? { ...i, [campo]: valor } : i)),
    );
  }

  async function enviar() {
    const validos = (itens ?? []).filter((i) => i.titulo.trim());
    if (validos.length === 0) {
      toast.error("Preencha ao menos um título antes de enviar.");
      return;
    }
    setEnviando(true);
    const linhas = validos.map((item) => ({
      tipo_sugestao: "titulo",
      status: "pendente",
      sugerido_por: usuarioId,
      payload: {
        titulo: item.titulo.trim(),
        tipo_midia_id: tipoMidiaId,
        fonte_id: fonteId === "nenhuma" ? null : fonteId,
        identificador_externo: item.isbn.trim() || null,
        fonte_validacao: item.origem === "busca" ? "google_books" : "manual",
        metadados: ehJogo
          ? {
              plataforma: item.autor.trim() || null,
              desenvolvedora: item.editora.trim() || null,
              ano: item.ano.trim() || null,
            }
          : {
              autor: item.autor.trim() || null,
              editora: item.editora.trim() || null,
              ano: item.ano.trim() || null,
            },
      } as never,
    }));

    const { error } = await supabase.from("sugestoes").insert(linhas);
    setEnviando(false);

    if (error) {
      toast.error("Não foi possível enviar o lote. Tente novamente.");
      return;
    }
    toast.success(`${validos.length} sugestões enviadas para curadoria.`);
    onConcluir();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="lote-tipo">Tipo de mídia (todo o lote)</Label>
          <Select value={tipoMidiaId} onValueChange={setTipoMidiaId}>
            <SelectTrigger id="lote-tipo" className="w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {tipos.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.nome_exibicao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lote-fonte">Fonte / coleção (opcional)</Label>
          <Select value={fonteId} onValueChange={setFonteId}>
            <SelectTrigger id="lote-fonte" className="w-full">
              <SelectValue placeholder="Nenhuma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nenhuma">Nenhuma</SelectItem>
              {fontes.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="inline-flex rounded-lg border border-border p-1">
        {(
          [
            { valor: "texto", rotulo: "Colar texto" },
            { valor: "csv", rotulo: "Importar CSV" },
          ] as const
        ).map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            onClick={() => setEntrada(opcao.valor)}
            className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
              entrada === opcao.valor
                ? "border border-primary text-primary"
                : "border border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>

      {entrada === "texto" ? (
        <div className="space-y-1.5">
          <Label htmlFor="lote-texto">Um item por linha</Label>
          <Textarea
            id="lote-texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={8}
            placeholder={"9788535902778\nDom Casmurro | Machado de Assis | Editora | 1899"}
          />
          <p className="text-[11px] text-muted-foreground">
            Aceita só o ISBN (busca automática) ou <code>Título | Autor | Editora | Ano</code>,
            misturados na mesma lista.
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={processando}
            onClick={() => void processar(linhasDoTexto(texto))}
          >
            {processando ? "Processando…" : "Processar lista"}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="lote-csv">Arquivo .csv</Label>
          <Input
            id="lote-csv"
            type="file"
            accept=".csv,text/csv"
            disabled={processando}
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              if (arquivo) void lerCsv(arquivo);
            }}
          />
          <p className="text-[11px] text-muted-foreground">
            Colunas: <code>isbn,titulo,autor,editora,ano</code>. Com ISBN preenchido, a busca
            automática tem prioridade. {nomeArquivo && `Arquivo: ${nomeArquivo}`}
          </p>
          <Button type="button" variant="outline" onClick={baixarModelo}>
            Baixar modelo CSV
          </Button>
        </div>
      )}

      {itens && itens.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-serif text-lg">Prévia ({itens.length})</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-normal">Origem</th>
                  <th className="px-2 py-2 font-normal">Título</th>
                  <th className="px-2 py-2 font-normal">{ehJogo ? "Plataforma" : "Autor"}</th>
                  <th className="px-2 py-2 font-normal">
                    {ehJogo ? "Desenvolvedora" : "Editora"}
                  </th>
                  <th className="px-2 py-2 font-normal">Ano</th>
                  <th className="px-2 py-2 font-normal sr-only">Ações</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr key={item.chave} className="border-b border-border/60 last:border-0">
                    <td className="px-2 py-2 align-middle">
                      <span
                        className={`whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] ${
                          item.origem === "busca"
                            ? "border-primary text-primary"
                            : item.origem === "nao_encontrado"
                              ? "border-destructive text-destructive"
                              : "border-border text-muted-foreground"
                        }`}
                      >
                        {item.origem === "busca"
                          ? "Busca"
                          : item.origem === "nao_encontrado"
                            ? "Não encontrado"
                            : "Manual"}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={item.titulo}
                        onChange={(e) => atualizar(item.chave, "titulo", e.target.value)}
                        aria-label="Título"
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={item.autor}
                        onChange={(e) => atualizar(item.chave, "autor", e.target.value)}
                        aria-label={ehJogo ? "Plataforma" : "Autor"}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={item.editora}
                        onChange={(e) => atualizar(item.chave, "editora", e.target.value)}
                        aria-label={ehJogo ? "Desenvolvedora" : "Editora"}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={item.ano}
                        onChange={(e) => atualizar(item.chave, "ano", e.target.value)}
                        aria-label="Ano"
                        maxLength={4}
                        className="h-8 w-16 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        aria-label={`Remover ${item.titulo || "linha"}`}
                        onClick={() =>
                          setItens((atuais) =>
                            (atuais ?? []).filter((i) => i.chave !== item.chave),
                          )
                        }
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button type="button" className="w-full" disabled={enviando} onClick={() => void enviar()}>
            {enviando
              ? "Enviando…"
              : `Enviar ${itens.filter((i) => i.titulo.trim()).length} sugestões`}
          </Button>
        </section>
      )}
    </div>
  );
}
