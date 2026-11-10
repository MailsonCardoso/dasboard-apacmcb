import { queryOptions } from "@tanstack/react-query";
import { incomes } from "@/mocks/data";
import type { Income } from "@/types";
import { apiGet } from "./http";

/** GET /incomes — consulta de receitas centralizadas */
export const incomesService = {
  list: () => apiGet<Income[]>("/incomes", incomes),
};

export const incomesQuery = queryOptions({ queryKey: ["incomes"], queryFn: incomesService.list, staleTime: 60_000 });
