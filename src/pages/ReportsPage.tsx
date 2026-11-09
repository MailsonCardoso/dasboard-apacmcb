import { useMemo, useState } from "react";
import { FileBarChart } from "lucide-react";
import { PageHeader, Panel } from "@/components/finance/PageHeader";
import { DataTable, type Column } from "@/components/finance/DataTable";
import { ExportButtons } from "@/components/finance/ExportButtons";
import { Button } from "@/components/ui/button";
import { useFilters } from "@/hooks/use-filters";
import { useFinanceData } from "@/hooks/use-finance-data";
import { cashflowService } from "@/services/cashflow.service";
import type { ReportRow } from "@/services/reports.service";
import {
  byUnit, filterPeriod, groupByCategory, inPeriod, monthlySeries, paidExpense, pendingExpense, pendingIncome, periodBalance, receivedIncome, totalExpense, totalIncome,
} from "@/utils/finance";
import { formatBRL, formatDate, MONTHS_FULL } from "@/utils/format";

const REPORTS = [
  { id: "rec-mensal", name: "Relatório mensal de receitas" },
  { id: "des-mensal", name: "Relatório mensal de despesas" },
  { id: "demonstrativo", name: "Demonstrativo financeiro mensal" },
  { id: "anual", name: "Relatório anual" },
  { id: "des-cat", name: "Despesas por categoria" },
  { id: "rec-cat", name: "Receitas por categoria" },
  { id: "saldo", name: "Evolução do saldo" },
  { id: "unidades", name: "Comparativo entre unidades" },
  { id: "movimentacoes", name: "Movimentações por período" },
] as const;

type ReportId = (typeof REPORTS)[number]["id"];

export function ReportsPage() {
  const { unitId, year, month } = useFilters();
  const { incomes, expenses, units, unitName, connName } = useFinanceData();
  const [report, setReport] = useState<ReportId>("demonstrativo");
  const f = { unitId, year, month };

  const rows: ReportRow[] = useMemo(() => {
    const inc = filterPeriod(incomes, f);
    const exp = filterPeriod(expenses, f);
    const uInc = byUnit(incomes, unitId);
    const uExp = byUnit(expenses, unitId);
    switch (report) {
      case "rec-mensal":
        return inc.sort((a, b) => a.date.localeCompare(b.date)).map((r) => ({ Código: r.code, Data: formatDate(r.date), Descrição: r.description, Categoria: r.category, Unidade: unitName(r.unitId), Valor: formatBRL(r.amount), Situação: r.status, "Banco de origem": connName(r.connectionId) }));
      case "des-mensal":
        return exp.sort((a, b) => a.date.localeCompare(b.date)).map((r) => ({ Código: r.code, Data: formatDate(r.date), Descrição: r.description, Categoria: r.category, Unidade: unitName(r.unitId), Valor: formatBRL(r.amount), Vencimento: formatDate(r.dueDate), Pagamento: formatDate(r.paymentDate), Situação: r.status }));
      case "demonstrativo":
        return [
          { Item: "Receitas lançadas", Valor: formatBRL(totalIncome(inc)) },
          { Item: "(−) Receitas pendentes", Valor: formatBRL(pendingIncome(inc)) },
          { Item: "= Receitas recebidas", Valor: formatBRL(receivedIncome(inc)) },
          { Item: "Despesas lançadas", Valor: formatBRL(totalExpense(exp)) },
          { Item: "(−) Despesas pendentes/vencidas", Valor: formatBRL(pendingExpense(exp)) },
          { Item: "= Despesas pagas", Valor: formatBRL(paidExpense(exp)) },
          { Item: "Saldo do período (recebido − pago)", Valor: formatBRL(periodBalance(inc, exp)) },
        ];
      case "anual":
        return monthlySeries(uInc, uExp, year).map((s) => ({ Mês: MONTHS_FULL[s.month - 1] ?? "", Receitas: formatBRL(s.receitas), Despesas: formatBRL(s.despesas), "Saldo do mês": formatBRL(s.saldo), "Saldo acumulado": formatBRL(s.acumulado) }));
      case "saldo":
        return monthlySeries(uInc, uExp, year).map((s) => ({ Mês: MONTHS_FULL[s.month - 1] ?? "", "Saldo do mês": formatBRL(s.saldo), "Saldo acumulado": formatBRL(s.acumulado) }));
      case "des-cat":
      case "rec-cat": {
        const src: { category: string; amount: number }[] = report === "des-cat" ? exp : inc;
        const total = src.reduce((s, r) => s + r.amount, 0);
        return groupByCategory(src).map((c) => ({ Categoria: c.name, Valor: formatBRL(c.value), Participação: `${total ? ((c.value / total) * 100).toFixed(1).replace(".", ",") : 0}%` }));
      }
      case "unidades":
        return units.map((u) => {
          const i = filterPeriod(incomes, { ...f, unitId: u.id });
          const e = filterPeriod(expenses, { ...f, unitId: u.id });
          return { Unidade: u.name, Receitas: formatBRL(totalIncome(i)), Despesas: formatBRL(totalExpense(e)), Saldo: formatBRL(periodBalance(i, e)) };
        });
      case "movimentacoes":
        return cashflowService.build(uInc, uExp).filter((m) => inPeriod(m.date, year, month)).map((m) => ({ Data: formatDate(m.date), Código: m.code, Descrição: m.description, Unidade: unitName(m.unitId), Tipo: m.type, Entrada: m.inflow ? formatBRL(m.inflow) : "", Saída: m.outflow ? formatBRL(m.outflow) : "" }));
    }
  }, [report, incomes, expenses, units, unitId, year, month]);

  const current = REPORTS.find((r) => r.id === report) ?? REPORTS[2];
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const columns: Column<ReportRow>[] = headers.map((h) => ({ key: h, header: h, render: (r) => r[h], ...(/Valor|Receitas|Despesas|Saldo|Entrada|Saída/.test(h) ? { align: "right" as const } : {}) }));
  const annual = report === "anual" || report === "saldo";
  const scope = `${report === "unidades" || unitId === "all" ? "Todas as unidades" : unitName(unitId)} · ${!annual && month ? `${MONTHS_FULL[month - 1]}/${year}` : year}`;

  return (
    <>
      <PageHeader title="Relatórios" description="Relatórios gerenciais gerados a partir dos dados consultados." />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <nav aria-label="Tipos de relatório" className="space-y-1 border-b pb-3 lg:border-b-0 lg:border-r lg:pr-4">
          {REPORTS.map((r) => (
            <Button
              key={r.id}
              variant={report === r.id ? "default" : "ghost"}
              aria-pressed={report === r.id}
              onClick={() => setReport(r.id)}
              className="h-auto w-full justify-start whitespace-normal px-3 py-2 text-left"
            >
              <FileBarChart className="size-4 shrink-0" /> {r.name}
            </Button>
          ))}
        </nav>
        <Panel title={current.name} description={scope} actions={<ExportButtons rows={rows} name={`financecontrol-${report}-${year}${month ? `-${String(month).padStart(2, "0")}` : ""}`} title={current.name} subtitle={scope} />}>
          <DataTable rows={rows} columns={columns} rowKey={(r) => JSON.stringify(r)} pageSize={15} />
        </Panel>
      </div>
    </>
  );
}
