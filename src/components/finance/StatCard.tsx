import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/utils/format";

type Tone = "neutral" | "income" | "expense" | "highlight" | "warning";

const toneIcon: Record<Tone, string> = {
  neutral: "bg-secondary text-primary",
  income: "bg-income-soft text-income",
  expense: "bg-expense-soft text-expense",
  highlight: "bg-highlight-soft text-highlight",
  warning: "bg-warning-soft text-warning",
};

interface Props {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: Tone;
  change?: number | null;
  /** quando true, uma variação positiva é ruim (ex.: despesas) */
  invert?: boolean;
  hint?: string;
  valueTone?: "income" | "expense";
}

export function StatCard({ label, value, icon: Icon, tone = "neutral", change, invert, hint, valueTone }: Props) {
  const hasChange = change !== undefined;
  const good = change != null && (invert ? change < 0 : change > 0);
  const bad = change != null && (invert ? change > 0 : change < 0);
  const Arrow = change == null || change === 0 ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="min-w-0 rounded-lg border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="pt-1 text-xs font-medium text-muted-foreground">{label}</p>
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-md", toneIcon[tone])}>
          <Icon className="size-4.5" />
        </span>
      </div>
      <p
        className={cn(
          "mt-4 font-sans text-xl font-semibold leading-tight tabular",
          valueTone === "income" && "text-income",
          valueTone === "expense" && "text-expense",
        )}
      >
        {value}
      </p>
      <div className="mt-4 flex min-h-5 flex-wrap items-center gap-2 border-t pt-3 text-xs">
        {hasChange && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 font-medium",
              good && "bg-income-soft text-income",
              bad && "bg-expense-soft text-expense",
              !good && !bad && "bg-muted text-muted-foreground",
            )}
          >
            <Arrow className="size-3" />
            {formatPercent(change ?? null)}
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
