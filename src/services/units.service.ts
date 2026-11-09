import { queryOptions } from "@tanstack/react-query";
import { units } from "@/mocks/data";
import type { Unit } from "@/types";
import { simulate } from "./http";

/** GET /units */
export const unitsService = { list: () => simulate<Unit[]>(units) };

export const unitsQuery = queryOptions({ queryKey: ["units"], queryFn: unitsService.list, staleTime: Infinity });
