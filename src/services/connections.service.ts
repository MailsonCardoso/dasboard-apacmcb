import { queryOptions } from "@tanstack/react-query";
import { connections } from "@/mocks/data";
import type { DbConnection } from "@/types";
import { apiGet, apiPost } from "./http";

/** GET /connections — cadastro de configuração do FinanceControl */
export const connectionsService = {
  list: () => apiGet<DbConnection[]>("/connections", connections),
  /** POST /connections/:id/test — verificação de conectividade */
  test: async (c: DbConnection) => {
    const fallbackMessage = c.status === "offline"
      ? { ok: false, message: `Não foi possível alcançar ${c.host}:${c.port}` }
      : { ok: true, message: `Conexão estabelecida (somente leitura) em ${c.status === "instavel" ? "1.840" : "48"} ms` };

    return apiPost<{ ok: boolean; message: string }>(`/connections/${c.id}/test`, {}, fallbackMessage);
  },
};

export const connectionsQuery = queryOptions({ queryKey: ["connections"], queryFn: connectionsService.list, staleTime: 60_000 });
