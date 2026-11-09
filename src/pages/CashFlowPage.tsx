import { useMemo, useState } from "react";
import { ArrowDownUp, ArrowDownLeft, ArrowUpRight, Landmark, Search, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/finance/StatCard";
import { PageHeader, Panel } from "@/components/finance/PageHeader";
import { DataTable, type Column } from "@/components/finance/DataTable";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { DetailDialog } from "@/components/finance/DetailDialog";
import { CompetenceSelect, SimpleSelect, UnitSelect } from "@/components/finance/Selectors";
import { useFilters } from "@/hooks/use-filters";
import { useFinanceData } from "@/hooks/use-finance-data";
import { cashflowService } from "@/services/cashflow.service";
import { accumulatedBalance, byUnit, inPeriod } from "@/utils/finance";
import { formatBRL, formatDate } from "@/utils/format";
import type { CashMovement } from "@/types";

export function CashFlowPage() {
  const g = useFilters();
  const { incomes, expenses, unitName, connName } = useFinanceData();
  const [unitId, setUnitId] = useState(g.unitId);
  const [year, setYear] = useState(g.year);
  const [month, setMonth] = useState(g.month);
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");
  const [desc, setDesc] = useState(false);
  const [sel, setSel] = useState<CashMovement | null>(null);

  const { flow, opening } = useMemo(() => {
    const uInc = byUnit(incomes, unitId);
    const uExp = byUnit(expenses, unitId);
    const start = `${year}-${String(month || 1).padStart(2, "0")}-01`;
    const dayBefore = new Date(Date.parse(`${start}T00:00:00Z`) - 864e5).toISOString().slice(0, 10);
    const opening = accumulatedBalance(uInc, uExp, dayBefore);
    const all = cashflowService.build(uInc, uExp, 0);
    const inside = all.filter((m) => inPeriod(m.date, year, month));
    // recalcula saldo corrente a partir do saldo de abertura do período
    let bal = opening;
    const flow = inside.map((m) => ({ ...m, balanceAfter: (bal = Math.round((bal + m.inflow - m.outflow) * 100) / 100) }));
    return { flow, opening };
  }, [incomes, expenses, unitId, year, month]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const r = flow
      .filter((m) => type === "all" || m.type === type)
      .filter((m) => !s || m.description.toLowerCase().includes(s) || m.code.toLowerCase().includes(s) || m.category.toLowerCase().includes(s));
    return desc ? [...r].reverse() : r;
  }, [flow, type, q, desc]);

  const inflow = flow.reduce((s, m) => s + m.inflow, 0);
  const outflow = flow.reduce((s, m) => s + m.outflow, 0);
  const closing = flow.length ? flow[flow.length - 1].balanceAfter : opening;

  const columns: Column<CashMovement>[] = [
    { key: "date", header: "Data", render: (r) => formatDate(r.date) },
    { key: "code", header: "Código", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: "desc", header: "Descrição", render: (r) => r.description },
    { key: "unit", header: "Unidade", render: (r) => unitName(r.unitId) },
    { key: "cat", header: "Categoria", render: (r) => r.category },
    { key: "type", header: "Tipo", render: (r) => <StatusBadge status={r.type} /> },
    { key: "in", header: "Entrada", align: "right", render: (r) => (r.inflow ? <span className="text-income">{formatBRL(r.inflow)}</span> : "—") },
    { key: "out", header: "Saída", align: "right", render: (r) => (r.outflow ? <span className="text-expense">{formatBRL(r.outflow)}</span> : "—") },
    { key: "bal", header: "Saldo após", align: "right", render: (r) => <span className={`font-medium ${r.balanceAfter < 0 ? "text-expense" : ""}`}>{formatBRL(r.balanceAfter)}</span> },
    { key: "db", header: "Banco de origem", render: (r) => <span className="text-xs text-muted-foreground">{connName(r.connectionId)}</span> },
  ];

  return (
    <>
      <PageHeader title="Fluxo de caixa" description="Movimentações efetivadas (recebidas e pagas) em ordem cronológica." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Saldo inicial" value={formatBRL(opening)} icon={Landmark} />
        <StatCard label="Entradas" value={formatBRL(inflow)} icon={ArrowUpRight} tone="income" valueTone="income" />
        <StatCard label="Saídas" value={formatBRL(outflow)} icon={ArrowDownLeft} tone="expense" valueTone="expense" />
        <StatCard label="Saldo final" value={formatBRL(closing)} icon={Wallet} tone="highlight" valueTone={closing >= 0 ? "income" : "expense"} />
      </div>
      <Panel className="mt-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input placeholder="Pesquisar movimentações" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
          </div>
          <UnitSelect value={unitId} onChange={setUnitId} />
          <CompetenceSelect year={year} month={month} onYear={setYear} onMonth={setMonth} />
          <SimpleSelect label="Tipo" value={type} onChange={setType} className="sm:w-36" options={[{ value: "all", label: "Todos os tipos" }, { value: "Entrada", label: "Entradas" }, { value: "Saída", label: "Saídas" }]} />
          <Button variant="outline" onClick={() => setDesc(!desc)}>
            <ArrowDownUp /> {desc ? "Mais recentes" : "Mais antigas"}
          </Button>
        </div>
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} onRowClick={setSel} pageSize={15} />
      </Panel>
      <DetailDialog
        open={!!sel}
        onOpenChange={(o) => !o && setSel(null)}
        title={sel?.description ?? ""}
        subtitle={sel?.code}
        items={sel ? [
          { label: "Data", value: formatDate(sel.date) },
          { label: "Tipo", value: <StatusBadge status={sel.type} /> },
          { label: "Valor", value: formatBRL(sel.inflow || sel.outflow) },
          { label: "Saldo após", value: formatBRL(sel.balanceAfter) },
          { label: "Categoria", value: sel.category },
          { label: "Unidade", value: unitName(sel.unitId) },
          { label: "Banco de origem", value: connName(sel.connectionId) },
        ] : []}
      />
    </>
  );
}
