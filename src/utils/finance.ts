import type { CashMovement, Expense, Income, PeriodFilter } from "@/types";

export const byUnit = <T extends { unitId: string }>(rows: T[], unitId: string) =>
  unitId === "all" ? rows : rows.filter((r) => r.unitId === unitId);

export function inPeriod(date: string, year: number, month: number) {
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7));
  return y === year && (month === 0 || m === month);
}

export function filterPeriod<T extends { date: string; unitId: string }>(rows: T[], f: PeriodFilter) {
  return byUnit(rows, f.unitId).filter((r) => inPeriod(r.date, f.year, f.month));
}

/** Último dia (YYYY-MM-DD) do período selecionado */
export function periodEnd(year: number, month: number) {
  if (month === 0) return `${year}-12-31`;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

export function previousPeriod(year: number, month: number): { year: number; month: number } {
  if (month === 0) return { year: year - 1, month: 0 };
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

const sum = (a: number[]) => Math.round(a.reduce((s, v) => s + v, 0) * 100) / 100;

export const totalIncome = (rows: Income[]) => sum(rows.map((r) => r.amount));
export const receivedIncome = (rows: Income[]) => sum(rows.filter((r) => r.status === "Recebida").map((r) => r.amount));
export const pendingIncome = (rows: Income[]) => sum(rows.filter((r) => r.status === "Pendente").map((r) => r.amount));

export const totalExpense = (rows: Expense[]) => sum(rows.map((r) => r.amount));
export const paidExpense = (rows: Expense[]) => sum(rows.filter((r) => r.status === "Paga").map((r) => r.amount));
export const pendingExpense = (rows: Expense[]) => sum(rows.filter((r) => r.status !== "Paga").map((r) => r.amount));
export const overdueExpense = (rows: Expense[]) => sum(rows.filter((r) => r.status === "Vencida").map((r) => r.amount));

/** Saldo mensal = receitas efetivamente recebidas - despesas efetivamente pagas */
export const periodBalance = (inc: Income[], exp: Expense[]) =>
  Math.round((receivedIncome(inc) - paidExpense(exp)) * 100) / 100;

/** Saldo acumulado = todo o histórico recebido - pago até a data final (inclusive) */
export function accumulatedBalance(inc: Income[], exp: Expense[], until: string) {
  return periodBalance(
    inc.filter((r) => r.date <= until),
    exp.filter((r) => (r.paymentDate ?? r.date) <= until),
  );
}

export function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

/** Fluxo de caixa: apenas movimentações efetivadas, em ordem cronológica, com saldo corrente. */
export function buildCashFlow(inc: Income[], exp: Expense[], opening = 0): CashMovement[] {
  const moves = [
    ...inc.filter((i) => i.status === "Recebida").map((i) => ({
      id: i.id, date: i.date, code: i.code, description: i.description, unitId: i.unitId,
      category: i.category, type: "Entrada" as const, inflow: i.amount, outflow: 0, connectionId: i.connectionId,
    })),
    ...exp.filter((e) => e.status === "Paga").map((e) => ({
      id: e.id, date: e.paymentDate ?? e.date, code: e.code, description: e.description, unitId: e.unitId,
      category: e.category, type: "Saída" as const, inflow: 0, outflow: e.amount, connectionId: e.connectionId,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.code.localeCompare(b.code));
  let bal = opening;
  return moves.map((m) => {
    bal = Math.round((bal + m.inflow - m.outflow) * 100) / 100;
    return { ...m, balanceAfter: bal };
  });
}

export function groupByCategory<T extends { category: string; amount: number }>(rows: T[]) {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const cat = typeof r.category === "object" ? ((r.category as any)?.nome || "Outras") : String(r.category || "Outras");
    map.set(cat, (map.get(cat) ?? 0) + r.amount);
  });
  return [...map.entries()].map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 })).sort((a, b) => b.value - a.value);
}

/** Série mensal do ano: receitas, despesas, saldo do mês e saldo acumulado */
export function monthlySeries(inc: Income[], exp: Expense[], year: number) {
  let acc = accumulatedBalance(inc, exp, `${year - 1}-12-31`);
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const mi = inc.filter((r) => inPeriod(r.date, year, m));
    const me = exp.filter((r) => inPeriod(r.date, year, m));
    const saldo = periodBalance(mi, me);
    acc = Math.round((acc + saldo) * 100) / 100;
    return { month: m, receitas: totalIncome(mi), despesas: totalExpense(me), saldo, acumulado: acc };
  });
}
