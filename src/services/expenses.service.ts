import { queryOptions } from "@tanstack/react-query";
import { expenses } from "@/mocks/data";
import type { Expense } from "@/types";
import { simulate } from "./http";

/** GET /expenses — consulta somente leitura */
export const expensesService = { list: () => simulate<Expense[]>(expenses) };

export const expensesQuery = queryOptions({ queryKey: ["expenses"], queryFn: expensesService.list, staleTime: 60_000 });
