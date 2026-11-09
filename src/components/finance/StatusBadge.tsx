import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  Recebida: "bg-income-soft text-income",
  Paga: "bg-income-soft text-income",
  online: "bg-income-soft text-income",
  Ativa: "bg-income-soft text-income",
  Pendente: "bg-warning-soft text-warning",
  instavel: "bg-warning-soft text-warning",
  Vencida: "bg-expense-soft text-expense",
  offline: "bg-expense-soft text-expense",
  Inativa: "bg-muted text-muted-foreground",
  Entrada: "bg-income-soft text-income",
  Saída: "bg-expense-soft text-expense",
};

const labels: Record<string, string> = { online: "Online", offline: "Indisponível", instavel: "Instável" };

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", styles[status] ?? "bg-muted")}>
      <span className="size-1.5 rounded-full bg-current" />
      {labels[status] ?? status}
    </span>
  );
}
