import { useMemo } from "react";
import { Landmark, PiggyBank, TrendingDown, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/finance/StatCard";
import { PageHeader, Panel } from "@/components/finance/PageHeader";
import { BalanceLine, CategoryDonut, IncomeExpenseBars } from "@/components/finance/Charts";
import { useFilters } from "@/hooks/use-filters";
import { useFinanceData } from "@/hooks/use-finance-data";
import {
  accumulatedBalance, byUnit, filterPeriod, groupByCategory, monthlySeries, pctChange, periodBalance, periodEnd, previousPeriod, totalExpense, totalIncome,
} from "@/utils/finance";
import { formatBRL, MONTHS, MONTHS_FULL } from "@/utils/format";

export function DashboardPage() {
  const f = useFilters();
  const { incomes, expenses } = useFinanceData();

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
    return {
      rec: totalIncome(inc), recPrev: totalIncome(pInc),
      des: totalExpense(exp), desPrev: totalExpense(pExp),
      saldo: periodBalance(inc, exp), saldoPrev: periodBalance(pInc, pExp),
      acc, accPrev, series,
      expCat: groupByCategory(exp), incCat: groupByCategory(inc),
    };
  }, [f, incomes, expenses]);

  const periodLabel = f.month === 0 ? `Ano de ${f.year}` : `${MONTHS_FULL[f.month - 1]} de ${f.year}`;
  const prevLabel = f.month === 0 ? "vs. ano anterior" : "vs. mês anterior";

  return (
    <>
      <PageHeader title="Dashboard financeiro" description={`Visão consolidada — ${periodLabel}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={f.month ? "Receitas do mês" : "Receitas do período"} value={formatBRL(d.rec)} icon={TrendingUp} tone="income" change={pctChange(d.rec, d.recPrev)} hint={prevLabel} />
        <StatCard label={f.month ? "Despesas do mês" : "Despesas do período"} value={formatBRL(d.des)} icon={TrendingDown} tone="expense" change={pctChange(d.des, d.desPrev)} invert hint={prevLabel} />
        <StatCard label={f.month ? "Saldo do mês" : "Saldo do período"} value={formatBRL(d.saldo)} icon={PiggyBank} tone="highlight" valueTone={d.saldo >= 0 ? "income" : "expense"} change={pctChange(d.saldo, d.saldoPrev)} hint="recebido − pago" />
        <StatCard label="Saldo acumulado" value={formatBRL(d.acc)} icon={Landmark} tone="neutral" valueTone={d.acc >= 0 ? "income" : "expense"} change={pctChange(d.acc, d.accPrev)} hint={prevLabel} />
      </div>

      <div className="mt-8 grid gap-x-8 gap-y-8 lg:grid-cols-2">
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
      </div>
    </>
  );
}
