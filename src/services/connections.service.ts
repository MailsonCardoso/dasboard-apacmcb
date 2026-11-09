import { queryOptions } from "@tanstack/react-query";
import { connections } from "@/mocks/data";
import type { DbConnection } from "@/types";
import { simulate } from "./http";

/** GET /connections — cadastro de configuração do FinanceControl (não altera bancos de origem). */
export const connectionsService = {
  list: () => simulate<DbConnection[]>(connections),
  /** POST /connections/:id/test — demonstrativo */
  test: async (c: DbConnection) => {
    await simulate(null, 900);
    if (c.status === "offline") return { ok: false, message: `Não foi possível alcançar ${c.host}:${c.port}` };
    return { ok: true, message: `Conexão estabelecida (somente leitura) em ${c.status === "instavel" ? "1.840" : "48"} ms` };
  },
};

export const connectionsQuery = queryOptions({ queryKey: ["connections"], queryFn: connectionsService.list });
