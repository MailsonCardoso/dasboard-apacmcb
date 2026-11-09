import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Search, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/finance/StatCard";
import { PageHeader, Panel } from "@/components/finance/PageHeader";
import { DataTable, type Column } from "@/components/finance/DataTable";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { DetailDialog } from "@/components/finance/DetailDialog";
import { CompetenceSelect, SimpleSelect, UnitSelect } from "@/components/finance/Selectors";
import { useFilters } from "@/hooks/use-filters";
import { useFinanceData } from "@/hooks/use-finance-data";
import { byUnit, inPeriod, overdueExpense, paidExpense, totalExpense } from "@/utils/finance";
import { formatBRL, formatDate } from "@/utils/format";
import type { Expense } from "@/types";

export function ExpensesPage() {
  const g = useFilters();
  const { expenses, unitName, connName } = useFinanceData();
  const [unitId, setUnitId] = useState(g.unitId);
  const [year, setYear] = useState(g.year);
  const [month, setMonth] = useState(g.month);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Expense | null>(null);

  const cats = useMemo(() => [...new Set(expenses.map((i) => i.category))].sort(), [expenses]);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return byUnit(expenses, unitId)
      .filter((r) => (from || to ? (!from || r.date >= from) && (!to || r.date <= to) : inPeriod(r.date, year, month)))
      .filter((r) => cat === "all" || r.category === cat)
      .filter((r) => status === "all" || r.status === status)
      .filter((r) => !s || r.description.toLowerCase().includes(s) || r.code.toLowerCase().includes(s))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, unitId, year, month, from, to, cat, status, q]);

  const pendingOnly = rows.filter((r) => r.status === "Pendente").reduce((s, r) => s + r.amount, 0);

  const columns: Column<Expense>[] = [
    { key: "code", header: "Código", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: "date", header: "Data", render: (r) => formatDate(r.date) },
    { key: "desc", header: "Descrição", render: (r) => <span className="inline-flex items-center gap-1.5">{r.status === "Vencida" && <AlertTriangle className="size-3.5 text-expense" />}{r.description}</span> },
    { key: "cat", header: "Categoria", render: (r) => r.category },
    { key: "unit", header: "Unidade", render: (r) => unitName(r.unitId) },
    { key: "amount", header: "Valor", align: "right", render: (r) => <span className="font-medium text-expense">{formatBRL(r.amount)}</span> },
    { key: "due", header: "Vencimento", render: (r) => <span className={r.status === "Vencida" ? "font-medium text-expense" : ""}>{formatDate(r.dueDate)}</span> },
    { key: "pay", header: "Pagamento", render: (r) => formatDate(r.paymentDate) },
    { key: "status", header: "Situação", render: (r) => <StatusBadge status={r.status} /> },
    { key: "db", header: "Banco de origem", render: (r) => <span className="text-xs text-muted-foreground">{connName(r.connectionId)}</span> },
  ];

  return (
    <>
      <PageHeader title="Despesas" description="Consulta de despesas registradas nos bancos das unidades." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total de despesas" value={formatBRL(totalExpense(rows))} icon={TrendingDown} tone="highlight" hint={`${rows.length} lançamentos`} />
        <StatCard label="Despesas pagas" value={formatBRL(paidExpense(rows))} icon={CheckCircle2} tone="income" />
        <StatCard label="Despesas pendentes" value={formatBRL(pendingOnly)} icon={Clock} tone="warning" hint="a vencer" />
        <StatCard label="Despesas vencidas" value={formatBRL(overdueExpense(rows))} icon={AlertTriangle} tone="expense" valueTone="expense" />
      </div>
      <Panel className="mt-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input placeholder="Pesquisar descrição ou código" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
          </div>
          <UnitSelect value={unitId} onChange={setUnitId} />
          <CompetenceSelect year={year} month={month} onYear={setYear} onMonth={setMonth} />
          <Input type="date" aria-label="Data inicial" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full sm:w-40" />
          <Input type="date" aria-label="Data final" value={to} onChange={(e) => setTo(e.target.value)} className="w-full sm:w-40" />
          <SimpleSelect label="Categoria" value={cat} onChange={setCat} options={[{ value: "all", label: "Todas categorias" }, ...cats.map((c) => ({ value: c, label: c }))]} />
          <SimpleSelect label="Situação" value={status} onChange={setStatus} className="sm:w-36" options={[{ value: "all", label: "Todas situações" }, { value: "Paga", label: "Paga" }, { value: "Pendente", label: "Pendente" }, { value: "Vencida", label: "Vencida" }]} />
        </div>
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} onRowClick={setSel} rowClassName={(r) => (r.status === "Vencida" ? "bg-expense-soft/50" : undefined)} />
      </Panel>
      <DetailDialog
        open={!!sel}
        onOpenChange={(o) => !o && setSel(null)}
        title={sel?.description ?? ""}
        subtitle={sel?.code}
        items={sel ? [
          { label: "Data", value: formatDate(sel.date) },
          { label: "Valor", value: <span className="text-expense">{formatBRL(sel.amount)}</span> },
          { label: "Vencimento", value: formatDate(sel.dueDate) },
          { label: "Pagamento", value: formatDate(sel.paymentDate) },
          { label: "Categoria", value: sel.category },
          { label: "Situação", value: <StatusBadge status={sel.status} /> },
          { label: "Unidade", value: unitName(sel.unitId) },
          { label: "Banco de origem", value: connName(sel.connectionId) },
        ] : []}
      />
    </>
  );
}
