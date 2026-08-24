import { useState } from "react";
import { toast } from "sonner";
import { Trash } from "@phosphor-icons/react";

import { supabase } from "@/integrations/supabase/client";

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

import type { TipoMidiaLote } from "@/components/sugerir/lote-titulos";

export interface ItemFonteLote {
  chave: string;
  nome: string;
  descricao: string;
  total: string;
}

const MODELO_CSV =
  "nome,descricao,total_titulos_oficial\n" +
  'Combo Literatura MBC,"Coleção fechada com volumes numerados",12\n' +
  "Livros avulsos de história,Categoria aberta sem número fixo de volumes,\n";

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

function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

function linhasDoTexto(texto: string): ItemFonteLote[] {
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((nome, indice) => ({ chave: `t-${indice}`, nome, descricao: "", total: "" }));
}

function linhasDoCsv(conteudo: string): ItemFonteLote[] {
  const linhas = conteudo
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (linhas.length === 0) return [];

  const primeira = dividirLinhaCsv(linhas[0]!).map((c) => c.toLowerCase());
  const temCabecalho = primeira.includes("nome");
  const colunas = temCabecalho ? primeira : ["nome", "descricao", "total_titulos_oficial"];
  const corpo = temCabecalho ? linhas.slice(1) : linhas;

  return corpo.map((linha, indice) => {
    const campos = dividirLinhaCsv(linha);
    const pegar = (nome: string) => {
      const i = colunas.indexOf(nome);
      return i >= 0 ? (campos[i] ?? "") : "";
    };
    return {
      chave: `c-${indice}`,
      nome: pegar("nome"),
      descricao: pegar("descricao"),
      total: somenteDigitos(pegar("total_titulos_oficial")),
    };
  });
}

interface Props {
  tipos: TipoMidiaLote[];
  usuarioId: string;
  onConcluir: () => void;
}

export function LoteFontes({ tipos, usuarioId, onConcluir }: Props) {
  const tipoLivro = tipos.find((t) => t.nome === "livro") ?? tipos[0];

  const [entrada, setEntrada] = useState<"texto" | "csv">("texto");
  const [texto, setTexto] = useState("");
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [itens, setItens] = useState<ItemFonteLote[] | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [tipoMidiaId, setTipoMidiaId] = useState(tipoLivro?.id ?? "");

  function baixarModelo() {
    const blob = new Blob([MODELO_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo-colecoes-libria.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function processar(todos: ItemFonteLote[]) {
    const validos = todos.filter((i) => i.nome.trim());
    const descartadas = todos.length - validos.length;
    if (validos.length === 0) {
      toast.error("Nenhuma linha válida: cada linha precisa de um nome de coleção.");
      return;
    }
    setItens(validos);
    toast.success(
      `${validos.length} coleções na prévia.` +
        (descartadas > 0 ? ` ${descartadas} ignoradas (sem nome).` : ""),
    );
  }

  async function lerCsv(arquivo: File) {
    const conteudo = await arquivo.text();
    setNomeArquivo(arquivo.name);
    processar(linhasDoCsv(conteudo));
  }

  function atualizar(chave: string, campo: keyof ItemFonteLote, valor: string) {
    setItens((atuais) =>
      (atuais ?? []).map((i) => (i.chave === chave ? { ...i, [campo]: valor } : i)),
    );
  }

  async function enviar() {
    const validos = (itens ?? []).filter((i) => i.nome.trim());
    if (validos.length === 0) {
      toast.error("Preencha ao menos um nome antes de enviar.");
      return;
    }
    if (!tipoMidiaId) {
      toast.error("Selecione o tipo de mídia.");
      return;
    }
    setEnviando(true);
    const linhas = validos.map((item) => ({
      tipo_sugestao: "fonte",
      status: "pendente",
      sugerido_por: usuarioId,
      payload: {
        nome: item.nome.trim(),
        descricao: item.descricao.trim() || null,
        tipo_midia_id: tipoMidiaId,
        total_titulos_oficial: item.total.trim() ? Number(item.total) : null,
      } as never,
    }));

    const { error } = await supabase.from("sugestoes").insert(linhas);
    setEnviando(false);

    if (error) {
      toast.error("Não foi possível enviar o lote. Tente novamente.");
      return;
    }
    toast.success(`${validos.length} sugestões de coleção enviadas para curadoria.`);
    onConcluir();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="lote-fonte-tipo">Tipo de mídia predominante (todo o lote)</Label>
        <Select value={tipoMidiaId} onValueChange={setTipoMidiaId}>
          <SelectTrigger id="lote-fonte-tipo" className="w-full">
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
          <Label htmlFor="lote-fonte-texto">Uma coleção por linha</Label>
          <Textarea
            id="lote-fonte-texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={8}
            placeholder={"Combo Literatura MBC\nLivros avulsos de história"}
          />
          <p className="text-[11px] text-muted-foreground">
            Só o nome. Descrição e total de títulos podem ser preenchidos na prévia.
          </p>
          <Button type="button" variant="outline" onClick={() => processar(linhasDoTexto(texto))}>
            Processar lista
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="lote-fonte-csv">Arquivo .csv</Label>
          <Input
            id="lote-fonte-csv"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              if (arquivo) void lerCsv(arquivo);
            }}
          />
          <p className="text-[11px] text-muted-foreground">
            Colunas: <code>nome,descricao,total_titulos_oficial</code>. Descrição e total são
            opcionais — deixe o total vazio para categorias abertas.{" "}
            {nomeArquivo && `Arquivo: ${nomeArquivo}`}
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
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-normal">Nome</th>
                  <th className="px-2 py-2 font-normal">Descrição</th>
                  <th className="px-2 py-2 font-normal">Total</th>
                  <th className="px-2 py-2 font-normal sr-only">Ações</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr key={item.chave} className="border-b border-border/60 last:border-0">
                    <td className="px-2 py-2">
                      <Input
                        value={item.nome}
                        onChange={(e) => atualizar(item.chave, "nome", e.target.value)}
                        aria-label="Nome da coleção"
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={item.descricao}
                        onChange={(e) => atualizar(item.chave, "descricao", e.target.value)}
                        aria-label="Descrição"
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={item.total}
                        onChange={(e) =>
                          atualizar(item.chave, "total", somenteDigitos(e.target.value))
                        }
                        aria-label="Total de títulos oficial"
                        inputMode="numeric"
                        maxLength={4}
                        className="h-8 w-16 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        aria-label={`Remover ${item.nome || "linha"}`}
                        onClick={() =>
                          setItens((atuais) => (atuais ?? []).filter((i) => i.chave !== item.chave))
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

          <Button
            type="button"
            className="w-full"
            disabled={enviando}
            onClick={() => void enviar()}
          >
            {enviando
              ? "Enviando…"
              : `Enviar ${itens.filter((i) => i.nome.trim()).length} coleções`}
          </Button>
        </section>
      )}
    </div>
  );
}
