import { useSuspenseQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { unitsQuery } from "@/services/units.service";
import { MONTHS_FULL } from "@/utils/format";
import { cn } from "@/lib/utils";

export function UnitSelect({ value, onChange, className, allLabel = "Todas as unidades" }: { value: string; onChange: (v: string) => void; className?: string; allLabel?: string }) {
  const { data: units } = useSuspenseQuery(unitsQuery);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("w-full sm:w-52", className)} aria-label="Unidade">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {units.map((u) => (
          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export const YEARS = [2025, 2026];

export function CompetenceSelect({ year, month, onYear, onMonth, allowAllMonths = true }: { year: number; month: number; onYear: (v: number) => void; onMonth: (v: number) => void; allowAllMonths?: boolean }) {
  return (
    <div className="flex gap-2">
      <Select value={String(month)} onValueChange={(v) => onMonth(Number(v))}>
        <SelectTrigger className="w-full sm:w-36" aria-label="Mês"><SelectValue /></SelectTrigger>
        <SelectContent>
          {allowAllMonths && <SelectItem value="0">Ano inteiro</SelectItem>}
          {MONTHS_FULL.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={String(year)} onValueChange={(v) => onYear(Number(v))}>
        <SelectTrigger className="w-24" aria-label="Ano"><SelectValue /></SelectTrigger>
        <SelectContent>
          {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

export function SimpleSelect({ value, onChange, options, label, className }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label: string; className?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("w-full sm:w-44", className)} aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
