import { queryOptions } from "@tanstack/react-query";
import { expenses } from "@/mocks/data";
import type { Expense } from "@/types";
import { apiGet } from "./http";

function normalizeExpense(e: any): Expense {
  const category =
    typeof e.category === "object" && e.category !== null
      ? (e.category.nome || e.category.name || "Outras")
      : String(e.category || "");
  return { ...e, category };
}

/** GET /expenses — consulta de despesas centralizadas */
export const expensesService = {
  list: async () => {
    const list = await apiGet<Expense[]>("/expenses", []);
    return Array.isArray(list) ? list.map(normalizeExpense) : [];
  },
};

export const expensesQuery = queryOptions({ queryKey: ["expenses"], queryFn: expensesService.list, staleTime: 60_000 });
