import { queryOptions } from "@tanstack/react-query";
import { units } from "@/mocks/data";
import type { Unit } from "@/types";
import { apiGet } from "./http";

/** GET /units */
export const unitsService = {
  list: () => apiGet<Unit[]>("/units", units),
};

export const unitsQuery = queryOptions({ queryKey: ["units"], queryFn: unitsService.list, staleTime: 60_000 });
