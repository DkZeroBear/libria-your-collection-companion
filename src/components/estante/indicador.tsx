import { cn } from "@/lib/utils";

export function Indicador({
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
