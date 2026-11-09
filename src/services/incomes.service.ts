import { queryOptions } from "@tanstack/react-query";
import { incomes } from "@/mocks/data";
import type { Income } from "@/types";
import { simulate } from "./http";

/** GET /incomes — consulta somente leitura */
export const incomesService = { list: () => simulate<Income[]>(incomes) };

export const incomesQuery = queryOptions({ queryKey: ["incomes"], queryFn: incomesService.list, staleTime: 60_000 });
