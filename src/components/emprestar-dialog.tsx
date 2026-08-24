import { useState, type FormEvent } from "react";
import { HandArrowUp } from "@phosphor-icons/react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Registra um empréstimo de um título que o usuário tem (tenho = true).
 */
export function EmprestarDialog({
  tituloId,
  tituloNome,
  donoId,
  onRegistrado,
}: {
  tituloId: string;
  tituloNome: string;
  donoId: string;
  onRegistrado: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [dataEmprestimo, setDataEmprestimo] = useState(hoje());
  const [dataPrevista, setDataPrevista] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (!nome.trim()) {
      toast.error("Informe quem pegou o título.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.from("emprestimos").insert({
      titulo_id: tituloId,
      dono_id: donoId,
      pego_por_nome: nome.trim(),
      data_emprestimo: dataEmprestimo,
      data_devolucao_prevista: dataPrevista || null,
      canal_cobranca: "app",
    });
    setSalvando(false);

    if (error) {
      toast.error("Não foi possível registrar o empréstimo.");
      return;
    }

    toast.success(`“${tituloNome}” emprestado para ${nome.trim()}.`);
    setNome("");
    setDataEmprestimo(hoje());
    setDataPrevista("");
    setAberto(false);
    onRegistrado();
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <HandArrowUp size={12} />
          Emprestar
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Emprestar título</DialogTitle>
          <DialogDescription>{tituloNome}</DialogDescription>
        </DialogHeader>
        <form onSubmit={salvar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="emprestimo-nome">Quem pegou</Label>
            <Input
              id="emprestimo-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome da pessoa"
              maxLength={80}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emprestimo-data">Data do empréstimo</Label>
            <Input
              id="emprestimo-data"
              type="date"
              value={dataEmprestimo}
              onChange={(e) => setDataEmprestimo(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emprestimo-prevista">Devolução prevista (opcional)</Label>
            <Input
              id="emprestimo-prevista"
              type="date"
              value={dataPrevista}
              onChange={(e) => setDataPrevista(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={salvando}>
            {salvando ? "Registrando…" : "Registrar empréstimo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
