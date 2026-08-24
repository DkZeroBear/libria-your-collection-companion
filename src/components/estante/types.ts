export type Visao = "colecoes" | "tudo";
export type Filtro = "todos" | "tenho" | "faltam" | "lidos" | "quero";

export interface TituloColecao {
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

export interface PosseColecao {
  titulo_id: string;
  tenho: boolean;
  lido: boolean;
  quero: boolean;
}

export interface ColecaoDados {
  titulos: TituloColecao[];
  posses: PosseColecao[];
  emprestimos: import("@/components/emprestimos-bloco").EmprestimoAtivo[];
}

export interface GrupoColecao {
  nome: string;
  totalOficial: number | null;
  itens: TituloColecao[];
}

export const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "tenho", rotulo: "Tenho" },
  { valor: "faltam", rotulo: "Faltam" },
  { valor: "lidos", rotulo: "Lidos" },
  { valor: "quero", rotulo: "Quero" },
];
