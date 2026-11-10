import { queryOptions } from "@tanstack/react-query";
import { incomes } from "@/mocks/data";
import type { Income } from "@/types";
import { apiGet } from "./http";

function normalizeIncome(i: any): Income {
  const category =
    typeof i.category === "object" && i.category !== null
      ? (i.category.nome || i.category.name || "Outras")
      : String(i.category || "");
  return { ...i, category };
}

/** GET /incomes — consulta de receitas centralizadas */
export const incomesService = {
  list: async () => {
    const list = await apiGet<Income[]>("/incomes", []);
    return Array.isArray(list) ? list.map(normalizeIncome) : [];
  },
};

export const incomesQuery = queryOptions({ queryKey: ["incomes"], queryFn: incomesService.list, staleTime: 60_000 });
