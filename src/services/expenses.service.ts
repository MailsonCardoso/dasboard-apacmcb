import { queryOptions } from "@tanstack/react-query";
import { expenses } from "@/mocks/data";
import type { Expense } from "@/types";
import { apiGet } from "./http";

/** GET /expenses — consulta de despesas centralizadas */
export const expensesService = {
  list: () => apiGet<Expense[]>("/expenses", expenses),
};

export const expensesQuery = queryOptions({ queryKey: ["expenses"], queryFn: expensesService.list, staleTime: 60_000 });
