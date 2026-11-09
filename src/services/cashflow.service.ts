import type { Expense, Income } from "@/types";
import { buildCashFlow } from "@/utils/finance";

/** Futuro: GET /cash-flow?unit=&from=&to= . Hoje calculado a partir das consultas. */
export const cashflowService = {
  build: (inc: Income[], exp: Expense[], opening = 0) => buildCashFlow(inc, exp, opening),
};
