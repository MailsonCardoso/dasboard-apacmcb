import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Search, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/finance/StatCard";
import { PageHeader, Panel } from "@/components/finance/PageHeader";
import { DataTable, type Column } from "@/components/finance/DataTable";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { DetailDialog } from "@/components/finance/DetailDialog";
import { SimpleSelect } from "@/components/finance/Selectors";
import { useFilters } from "@/hooks/use-filters";
import { useFinanceData } from "@/hooks/use-finance-data";
import { byUnit, inPeriod, pendingIncome, receivedIncome, totalIncome } from "@/utils/finance";
import { formatBRL, formatDate } from "@/utils/format";
import type { Income } from "@/types";

export function IncomesPage() {
  const { unitId, year, month } = useFilters();
  const { incomes, unitName, connName } = useFinanceData();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Income | null>(null);

  const cats = useMemo(() => [...new Set(incomes.map((i) => (typeof i.category === "object" ? ((i.category as any)?.nome || "") : i.category)))].sort(), [incomes]);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return byUnit(incomes, unitId)
      .filter((r) => (from || to ? (!from || r.date >= from) && (!to || r.date <= to) : inPeriod(r.date, year, month)))
      .filter((r) => cat === "all" || r.category === cat)
      .filter((r) => status === "all" || r.status === status)
      .filter((r) => !s || r.description.toLowerCase().includes(s) || r.code.toLowerCase().includes(s))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [incomes, unitId, year, month, from, to, cat, status, q]);

  const columns: Column<Income>[] = [
    { key: "code", header: "Código", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: "date", header: "Data", render: (r) => formatDate(r.date) },
    { key: "desc", header: "Descrição", render: (r) => r.description },
    { key: "cat", header: "Categoria", render: (r) => (typeof r.category === "object" ? ((r.category as any)?.nome || "") : r.category) },
    { key: "unit", header: "Unidade", render: (r) => unitName(r.unitId) },
    { key: "amount", header: "Valor", align: "right", render: (r) => <span className="font-medium text-income">{formatBRL(r.amount)}</span> },
    { key: "status", header: "Situação", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <>
      <PageHeader title="Receitas" description="Consulta de receitas registradas nos bancos das unidades." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total de receitas" value={formatBRL(totalIncome(rows))} icon={TrendingUp} tone="highlight" hint={`${rows.length} lançamentos`} />
        <StatCard label="Receitas recebidas" value={formatBRL(receivedIncome(rows))} icon={CheckCircle2} tone="income" valueTone="income" />
        <StatCard label="Receitas pendentes" value={formatBRL(pendingIncome(rows))} icon={Clock} tone="warning" hint="não consideradas no saldo" />
      </div>
      <Panel className="mt-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input placeholder="Pesquisar descrição ou código" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
          </div>
          <Input type="date" aria-label="Data inicial" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full sm:w-40" />
          <Input type="date" aria-label="Data final" value={to} onChange={(e) => setTo(e.target.value)} className="w-full sm:w-40" />
          <SimpleSelect label="Categoria" value={cat} onChange={setCat} options={[{ value: "all", label: "Todas categorias" }, ...cats.map((c) => ({ value: c, label: c }))]} />
          <SimpleSelect label="Situação" value={status} onChange={setStatus} className="sm:w-36" options={[{ value: "all", label: "Todas situações" }, { value: "Recebida", label: "Recebida" }, { value: "Pendente", label: "Pendente" }]} />
        </div>
        {(from || to) && <p className="mb-3 text-xs text-muted-foreground">Intervalo de datas ativo — mês/ano ignorados.</p>}
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} onRowClick={setSel} />
      </Panel>
      <DetailDialog
        open={!!sel}
        onOpenChange={(o) => !o && setSel(null)}
        title={sel?.description ?? ""}
        subtitle={sel?.code}
        items={sel ? [
          { label: "Data", value: formatDate(sel.date) },
          { label: "Valor", value: <span className="text-income">{formatBRL(sel.amount)}</span> },
          { label: "Categoria", value: typeof sel.category === "object" ? ((sel.category as any)?.nome || "") : sel.category },
          { label: "Situação", value: <StatusBadge status={sel.status} /> },
          { label: "Unidade", value: unitName(sel.unitId) },
          { label: "Banco de origem", value: connName(sel.connectionId) },
        ] : []}
      />
    </>
  );
}
