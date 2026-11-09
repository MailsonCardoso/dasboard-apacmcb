import { describe, expect, it } from "vitest";
import type { Expense, Income } from "@/types";
import { accumulatedBalance, buildCashFlow, filterPeriod, periodBalance } from "./finance";

const inc = (amount: number, status: Income["status"], date = "2026-03-10", unitId = "u1"): Income => ({
  id: `${amount}${status}${unitId}`, code: "R", date, description: "", category: "c", unitId, amount, status, connectionId: "c1",
});
const exp = (amount: number, status: Expense["status"], date = "2026-03-10", unitId = "u1"): Expense => ({
  id: `${amount}${status}${unitId}`, code: "D", date, dueDate: date, paymentDate: status === "Paga" ? date : null, description: "", category: "c", unitId, amount, status, connectionId: "c1",
});

describe("regras financeiras", () => {
  it("saldo mensal ignora receitas pendentes e despesas não pagas", () => {
    expect(periodBalance([inc(1000, "Recebida"), inc(500, "Pendente")], [exp(300, "Paga"), exp(200, "Pendente"), exp(100, "Vencida")])).toBe(700);
  });
  it("saldo acumulado soma histórico efetivado até a data", () => {
    const i = [inc(1000, "Recebida", "2026-01-05"), inc(400, "Recebida", "2026-02-05")];
    const e = [exp(300, "Paga", "2026-01-20")];
    expect(accumulatedBalance(i, e, "2026-01-31")).toBe(700);
    expect(accumulatedBalance(i, e, "2026-02-28")).toBe(1100);
  });
  it("seleção de unidade retorna só seus lançamentos; todas consolida sem duplicar", () => {
    const rows = [inc(100, "Recebida", "2026-03-01", "u1"), inc(50, "Recebida", "2026-03-01", "u2")];
    expect(filterPeriod(rows, { unitId: "u2", year: 2026, month: 3 })).toHaveLength(1);
    expect(filterPeriod(rows, { unitId: "all", year: 2026, month: 3 })).toHaveLength(2);
  });
  it("fluxo de caixa calcula saldo após cada movimentação", () => {
    const flow = buildCashFlow([inc(1000, "Recebida", "2026-03-01"), inc(9, "Pendente")], [exp(250, "Paga", "2026-03-02")], 100);
    expect(flow.map((m) => m.balanceAfter)).toEqual([1100, 850]);
  });
});
