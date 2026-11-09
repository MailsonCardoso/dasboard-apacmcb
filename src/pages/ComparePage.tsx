import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader, Panel } from "@/components/finance/PageHeader";
import { MultiLine, UnitsCompareBars } from "@/components/finance/Charts";
import { DataTable, type Column } from "@/components/finance/DataTable";
import { useFilters } from "@/hooks/use-filters";
import { useFinanceData } from "@/hooks/use-finance-data";
import { accumulatedBalance, byUnit, filterPeriod, monthlySeries, paidExpense, periodBalance, periodEnd, receivedIncome, totalExpense, totalIncome } from "@/utils/finance";
import { formatBRL, MONTHS, MONTHS_FULL } from "@/utils/format";

export function ComparePage() {
  const f = useFilters();
  const { units, incomes, expenses } = useFinanceData();
  const [selected, setSelected] = useState<string[]>(units.map((u) => u.id));

  const rows = useMemo(
    () =>
      units.filter((u) => selected.includes(u.id)).map((u) => {
        const inc = filterPeriod(incomes, { ...f, unitId: u.id });
        const exp = filterPeriod(expenses, { ...f, unitId: u.id });
        const rec = totalIncome(inc);
        return {
          id: u.id, label: u.name.replace("Unidade ", ""), name: u.name,
          receitas: rec, recebidas: receivedIncome(inc), despesas: totalExpense(exp), pagas: paidExpense(exp),
          saldo: periodBalance(inc, exp),
          acumulado: accumulatedBalance(byUnit(incomes, u.id), byUnit(expenses, u.id), periodEnd(f.year, f.month)),
          margem: rec ? ((rec - totalExpense(exp)) / rec) * 100 : 0,
        };
      }),
    [units, selected, incomes, expenses, f],
  );

  const evolution = useMemo(() => {
    const per = rows.map((r) => ({ name: r.label, s: monthlySeries(byUnit(incomes, r.id), byUnit(expenses, r.id), f.year) }));
    return MONTHS.map((m, i) => Object.fromEntries([["label", m], ...per.map((p) => [p.name, p.s[i].saldo])]));
  }, [rows, incomes, expenses, f.year]);

  const columns: Column<(typeof rows)[number]>[] = [
    { key: "n", header: "Unidade", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "r", header: "Receitas", align: "right", render: (r) => <span className="text-income">{formatBRL(r.receitas)}</span> },
    { key: "rr", header: "Recebidas", align: "right", render: (r) => formatBRL(r.recebidas) },
    { key: "d", header: "Despesas", align: "right", render: (r) => <span className="text-expense">{formatBRL(r.despesas)}</span> },
    { key: "dp", header: "Pagas", align: "right", render: (r) => formatBRL(r.pagas) },
    { key: "s", header: "Saldo", align: "right", render: (r) => <span className={r.saldo >= 0 ? "font-medium text-income" : "font-medium text-expense"}>{formatBRL(r.saldo)}</span> },
    { key: "a", header: "Acumulado", align: "right", render: (r) => formatBRL(r.acumulado) },
    { key: "m", header: "Margem", align: "right", render: (r) => `${r.margem.toFixed(1).replace(".", ",")}%` },
  ];

  const period = f.month ? `${MONTHS_FULL[f.month - 1]} de ${f.year}` : `Ano de ${f.year}`;

  return (
    <>
      <PageHeader title="Comparativo entre unidades" description={`Desempenho lado a lado — ${period}.`} />
      <div className="mb-4 flex flex-wrap gap-4 rounded-xl border bg-card p-4 shadow-card">
        {units.map((u) => (
          <label key={u.id} className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={selected.includes(u.id)} onCheckedChange={(c) => setSelected((s) => (c ? [...s, u.id] : s.filter((x) => x !== u.id)))} />
            {u.name}
          </label>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Receitas, despesas e saldo" description={period}><UnitsCompareBars data={rows} /></Panel>
        <Panel title="Saldo mensal por unidade" description={`Ano de ${f.year}`}><MultiLine data={evolution} series={rows.map((r) => r.label)} /></Panel>
      </div>
      <Panel title="Quadro comparativo" className="mt-4">
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} emptyText="Selecione ao menos uma unidade." />
      </Panel>
    </>
  );
}
