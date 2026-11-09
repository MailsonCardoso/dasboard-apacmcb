import { useSuspenseQuery, type QueryClient } from "@tanstack/react-query";
import { connectionsQuery } from "@/services/connections.service";
import { unitsQuery } from "@/services/units.service";
import { incomesQuery } from "@/services/incomes.service";
import { expensesQuery } from "@/services/expenses.service";

export const preloadFinance = (qc: QueryClient) =>
  Promise.all([qc.ensureQueryData(unitsQuery), qc.ensureQueryData(connectionsQuery), qc.ensureQueryData(incomesQuery), qc.ensureQueryData(expensesQuery)]);

export function useFinanceData() {
  const { data: units } = useSuspenseQuery(unitsQuery);
  const { data: connections } = useSuspenseQuery(connectionsQuery);
  const { data: incomes } = useSuspenseQuery(incomesQuery);
  const { data: expenses } = useSuspenseQuery(expensesQuery);
  const unitName = (id: string) => units.find((u) => u.id === id)?.name ?? id;
  const connName = (id: string) => connections.find((c) => c.id === id)?.name ?? id;
  return { units, connections, incomes, expenses, unitName, connName };
}
