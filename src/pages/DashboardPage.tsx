import { useMemo } from "react";
import { Building2, Database, Landmark, PiggyBank, TrendingDown, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/finance/StatCard";
import { PageHeader, Panel } from "@/components/finance/PageHeader";
import { BalanceLine, CategoryDonut, IncomeExpenseBars, UnitsCompareBars } from "@/components/finance/Charts";
import { useFilters } from "@/hooks/use-filters";
import { useFinanceData } from "@/hooks/use-finance-data";
import {
  accumulatedBalance, byUnit, filterPeriod, groupByCategory, monthlySeries, pctChange, periodBalance, periodEnd, previousPeriod, totalExpense, totalIncome,
} from "@/utils/finance";
import { formatBRL, MONTHS, MONTHS_FULL } from "@/utils/format";

export function DashboardPage() {
  const f = useFilters();
  const { incomes, expenses, units, connections } = useFinanceData();

  const d = useMemo(() => {
    const inc = filterPeriod(incomes, f);
    const exp = filterPeriod(expenses, f);
    const prev = { ...previousPeriod(f.year, f.month), unitId: f.unitId };
    const pInc = filterPeriod(incomes, prev);
    const pExp = filterPeriod(expenses, prev);
    const uInc = byUnit(incomes, f.unitId);
    const uExp = byUnit(expenses, f.unitId);
    const acc = accumulatedBalance(uInc, uExp, periodEnd(f.year, f.month));
    const accPrev = accumulatedBalance(uInc, uExp, periodEnd(prev.year, prev.month));
    const series = monthlySeries(uInc, uExp, f.year).map((s) => ({ ...s, label: MONTHS[s.month - 1] ?? "" }));
    const scopeUnits = f.unitId === "all" ? units : units.filter((u) => u.id === f.unitId);
    const compare = units.map((u) => {
      const ui = filterPeriod(incomes, { ...f, unitId: u.id });
      const ue = filterPeriod(expenses, { ...f, unitId: u.id });
      return { label: u.name.replace("Unidade ", ""), receitas: totalIncome(ui), despesas: totalExpense(ue), saldo: periodBalance(ui, ue) };
    });
    return {
      rec: totalIncome(inc), recPrev: totalIncome(pInc),
      des: totalExpense(exp), desPrev: totalExpense(pExp),
      saldo: periodBalance(inc, exp), saldoPrev: periodBalance(pInc, pExp),
      acc, accPrev, series, compare,
      expCat: groupByCategory(exp), incCat: groupByCategory(inc),
      unitsCount: scopeUnits.length,
      conns: connections.filter((c) => (f.unitId === "all" || c.unitId === f.unitId)),
    };
  }, [f, incomes, expenses, units, connections]);

  const periodLabel = f.month === 0 ? `Ano de ${f.year}` : `${MONTHS_FULL[f.month - 1]} de ${f.year}`;
  const prevLabel = f.month === 0 ? "vs. ano anterior" : "vs. mês anterior";
  const online = d.conns.filter((c) => c.status !== "offline").length;

  return (
    <>
      <PageHeader title="Dashboard financeiro" description={`Visão consolidada — ${periodLabel}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label={f.month ? "Receitas do mês" : "Receitas do período"} value={formatBRL(d.rec)} icon={TrendingUp} tone="income" change={pctChange(d.rec, d.recPrev)} hint={prevLabel} />
        <StatCard label={f.month ? "Despesas do mês" : "Despesas do período"} value={formatBRL(d.des)} icon={TrendingDown} tone="expense" change={pctChange(d.des, d.desPrev)} invert hint={prevLabel} />
        <StatCard label={f.month ? "Saldo do mês" : "Saldo do período"} value={formatBRL(d.saldo)} icon={PiggyBank} tone="highlight" valueTone={d.saldo >= 0 ? "income" : "expense"} change={pctChange(d.saldo, d.saldoPrev)} hint="recebido − pago" />
        <StatCard label="Saldo acumulado" value={formatBRL(d.acc)} icon={Landmark} tone="neutral" valueTone={d.acc >= 0 ? "income" : "expense"} change={pctChange(d.acc, d.accPrev)} hint={prevLabel} />
        <StatCard label="Total de unidades" value={String(d.unitsCount)} icon={Building2} tone="neutral" hint={`${units.filter((u) => u.active).length} ativas no total`} />
        <StatCard label="Bancos conectados" value={`${online} / ${d.conns.length}`} icon={Database} tone="warning" hint={d.conns.length - online ? `${d.conns.length - online} indisponível` : "todas disponíveis"} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Receitas x Despesas" description={`Mensal — ${f.year}`}>
          <IncomeExpenseBars data={d.series} />
        </Panel>
        <Panel title="Evolução do saldo" description="Saldo do mês e acumulado (valores efetivados)">
          <BalanceLine data={d.series} />
        </Panel>
        <Panel title="Despesas por categoria" description={periodLabel}>
          <CategoryDonut data={d.expCat} />
        </Panel>
        <Panel title="Receitas por categoria" description={periodLabel}>
          <CategoryDonut data={d.incCat} />
        </Panel>
        <Panel title="Comparativo entre unidades" description={periodLabel} className="lg:col-span-2">
          <UnitsCompareBars data={d.compare} />
        </Panel>
      </div>
    </>
  );
}
