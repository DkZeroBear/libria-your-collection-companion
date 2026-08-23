import { useState, type FormEvent } from "react";
import { ChatCircleDots } from "@phosphor-icons/react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const TIPOS = [
  { valor: "bug", rotulo: "Bug" },
  { valor: "sugestao", rotulo: "Sugestão" },
  { valor: "ideia", rotulo: "Ideia" },
] as const;

/**
 * Ponto de entrada discreto de feedback: abre um formulário que grava
 * direto em feedback_produto (RLS permite insert do próprio usuário).
 */
export function FeedbackDialog({ usuarioId }: { usuarioId: string }) {
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<string>("sugestao");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!titulo.trim() || !descricao.trim()) {
      toast.error("Preencha título e descrição.");
      return;
    }
    setEnviando(true);
    const { error } = await supabase.from("feedback_produto").insert({
      usuario_id: usuarioId,
      tipo,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
    });
    setEnviando(false);

    if (error) {
      toast.error("Não foi possível enviar seu feedback. Tente novamente.");
      return;
    }

    toast.success("Feedback enviado. Obrigado!");
    setTitulo("");
    setDescricao("");
    setTipo("sugestao");
    setAberto(false);
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ChatCircleDots size={14} />
          Feedback
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Enviar feedback</DialogTitle>
          <DialogDescription>
            Conte o que quebrou, o que sentiu falta ou o que faria diferente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={enviar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="feedback-tipo">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="feedback-tipo" className="w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t.valor} value={t.valor}>
                    {t.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="feedback-titulo">Título</Label>
            <Input
              id="feedback-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Resumo em uma linha"
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="feedback-descricao">Descrição</Label>
            <Textarea
              id="feedback-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhes, passos para reproduzir, contexto…"
              rows={4}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar feedback"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
