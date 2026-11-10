import { queryOptions } from "@tanstack/react-query";
import { units } from "@/mocks/data";
import type { Unit } from "@/types";
import { apiGet, apiPost } from "./http";

/** Endpoints /units — gerenciamento de unidades organizacionais */
export const unitsService = {
  list: () => apiGet<Unit[]>("/units", units),

  create: async (data: { name: string; code: string; description?: string; active?: boolean }) => {
    return apiPost<Unit>("/units", data, {
      id: `u${Date.now()}`,
      name: data.name,
      code: data.code,
      description: data.description || "",
      active: data.active ?? true,
    });
  },

  update: async (id: string, data: Partial<Unit>) => {
    return apiPost<Unit>(`/units/${id}`, { ...data, _method: "PUT" }, data as Unit);
  },

  delete: async (id: string) => {
    return apiPost<{ message: string }>(`/units/${id}`, { _method: "DELETE" }, { message: "Unidade excluída" });
  },
};

export const unitsQuery = queryOptions({ queryKey: ["units"], queryFn: unitsService.list, staleTime: 60_000 });
