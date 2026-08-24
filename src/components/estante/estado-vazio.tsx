import { Books } from "@phosphor-icons/react";

export function EstadoVazio({ mensagem }: { mensagem: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
      <Books size={18} className="shrink-0" />
      {mensagem}
    </div>
  );
}
