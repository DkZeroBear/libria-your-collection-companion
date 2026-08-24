import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BellRinging, CheckCircle, Tray } from "@phosphor-icons/react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { cobrarEmprestimo } from "@/lib/emprestimos.functions";

export interface EmprestimoAtivo {
  id: string;
  pego_por_nome: string;
  data_emprestimo: string;
  data_devolucao_prevista: string | null;
  ultima_cobranca_em: string | null;
  titulos: { titulo: string } | null;
}

function diasDesde(dataIso: string): number {
  const inicio = new Date(`${dataIso}T12:00:00`).getTime();
  return Math.max(0, Math.floor((Date.now() - inicio) / 86_400_000));
}

export function EmprestimosBloco({
  emprestimos,
  onMudanca,
}: {
  emprestimos: EmprestimoAtivo[];
  onMudanca: () => void;
}) {
  const cobrar = useServerFn(cobrarEmprestimo);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [bloqueios, setBloqueios] = useState<Record<string, string>>({});

  function formatarHora(iso: string) {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function proximaCobranca(e: EmprestimoAtivo): string | null {
    const doEstado = bloqueios[e.id];
    if (doEstado && new Date(doEstado).getTime() > Date.now()) return doEstado;
    if (e.ultima_cobranca_em) {
      const proxima =
        new Date(e.ultima_cobranca_em).getTime() + 4 * 60 * 60 * 1000;
      if (proxima > Date.now()) return new Date(proxima).toISOString();
    }
    return null;
  }

  async function marcarDevolvido(id: string) {
    setOcupado(id);
    const { error } = await supabase
      .from("emprestimos")
      .update({
        devolvido: true,
        data_devolucao_real: new Date().toISOString().slice(0, 10),
      })
      .eq("id", id);
    setOcupado(null);
    if (error) {
      toast.error("Não foi possível marcar como devolvido.");
      return;
    }
    toast.success("Empréstimo encerrado.");
    onMudanca();
  }

  async function handleCobrar(id: string) {
    setOcupado(id);
    try {
      const resultado = await cobrar({ data: { emprestimoId: id } });
      if (resultado.status === "sem_telegram") {
        toast.info(
          "Conecte seu Telegram em Configurações para receber os lembretes.",
        );
        return;
      }
      if (resultado.status === "aguarde") {
        setBloqueios((b) => ({ ...b, [id]: resultado.proximaCobrancaEm }));
        toast.info(
          `Você já cobrou há pouco. Próxima cobrança a partir de ${formatarHora(resultado.proximaCobrancaEm)}.`,
        );
        return;
      }
      toast.success("Lembrete enviado no seu Telegram.");
      onMudanca();
    } catch (erro) {
      toast.error(
        erro instanceof Error ? erro.message : "Não foi possível cobrar agora.",
      );
    } finally {
      setOcupado(null);
    }
  }

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-lg">Emprestados</h2>
        <Link
          to="/configuracoes"
          className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          Conectar Telegram
        </Link>
      </div>

      {emprestimos.length === 0 ? (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          <Tray size={18} className="shrink-0" />
          Nenhum empréstimo ativo. Use “Emprestar” em um título que você tem.
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {emprestimos.map((e) => {
            const dias = diasDesde(e.data_emprestimo);
            const bloqueadoAte = proximaCobranca(e);
            return (
              <li
                key={e.id}
                className="rounded-lg border border-border bg-card px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate">
                    {e.titulos?.titulo ?? "Título"}{" "}
                    <span className="text-muted-foreground">
                      com {e.pego_por_nome}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    há {dias} {dias === 1 ? "dia" : "dias"}
                    {e.data_devolucao_prevista &&
                      ` · devolve até ${new Date(`${e.data_devolucao_prevista}T12:00:00`).toLocaleDateString("pt-BR")}`}
                    {e.ultima_cobranca_em &&
                      ` · cobrado em ${new Date(e.ultima_cobranca_em).toLocaleDateString("pt-BR")}`}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={ocupado === e.id}
                    onClick={() => marcarDevolvido(e.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    <CheckCircle size={14} />
                    Devolvido
                  </button>
                  <button
                    type="button"
                    disabled={ocupado === e.id || bloqueadoAte !== null}
                    title={
                      bloqueadoAte
                        ? `Próxima cobrança a partir de ${formatarHora(bloqueadoAte)}`
                        : undefined
                    }
                    onClick={() => handleCobrar(e.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    <BellRinging size={14} />
                    {bloqueadoAte
                      ? `Cobrar a partir de ${formatarHora(bloqueadoAte)}`
                      : "Cobrar"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
