import { queryOptions } from "@tanstack/react-query";
import { connections } from "@/mocks/data";
import type { DbConnection } from "@/types";
import { apiGet, apiPost } from "./http";

/** GET /connections — cadastro de configuração do FinanceControl */
export const connectionsService = {
  list: () => apiGet<DbConnection[]>("/connections", []),

  create: async (data: Partial<DbConnection> & { password?: string }) => {
    const payload = {
      name: data.name,
      nome: data.name,
      unitId: data.unitId,
      unidade_id: data.unitId ? Number(String(data.unitId).replace(/\D/g, "")) : 1,
      type: data.type,
      tipo: data.type,
      host: data.host,
      port: Number(data.port) || 3306,
      porta: Number(data.port) || 3306,
      database: data.database,
      banco: data.database,
      user: data.user,
      usuario_leitura: data.user,
      password: data.password,
      description: data.description,
      descricao: data.description,
      status: data.status || "online",
      active: true,
      ativa: true,
    };
    return apiPost<DbConnection>("/connections", payload, {
      ...data,
      id: `c${Date.now()}`,
      status: "online",
      lastCheck: new Date().toISOString().slice(0, 19),
    } as DbConnection);
  },

  update: async (id: string, data: Partial<DbConnection> & { password?: string }) => {
    const cleanId = String(id).replace(/^c/, "");
    const payload = {
      name: data.name,
      nome: data.name,
      unitId: data.unitId,
      unidade_id: data.unitId ? Number(String(data.unitId).replace(/\D/g, "")) : undefined,
      type: data.type,
      tipo: data.type,
      host: data.host,
      port: data.port ? Number(data.port) : undefined,
      porta: data.port ? Number(data.port) : undefined,
      database: data.database,
      banco: data.database,
      user: data.user,
      usuario_leitura: data.user,
      password: data.password,
      description: data.description,
      descricao: data.description,
      status: data.status,
      _method: "PUT",
    };
    return apiPost<DbConnection>(`/connections/${cleanId}`, payload, data as DbConnection);
  },

  delete: async (id: string) => {
    const cleanId = String(id).replace(/^c/, "");
    return apiPost<{ message: string }>(`/connections/${cleanId}/delete`, { _method: "DELETE" }, { message: "Conexão desativada com sucesso." });
  },

  /** POST /connections/:id/test — verificação de conectividade */
  test: async (c: DbConnection) => {
    const fallbackMessage = c.status === "offline"
      ? { ok: false, message: `Não foi possível alcançar ${c.host}:${c.port}` }
      : { ok: true, message: `Conexão estabelecida (somente leitura) em ${c.status === "instavel" ? "1.840" : "48"} ms` };

    return apiPost<{ ok: boolean; message: string }>(`/connections/${c.id}/test`, {}, fallbackMessage);
  },

  /** POST /connections/:id/sync — sincronização de movimentações do banco remoto */
  sync: async (id: string | number) => {
    return apiPost<{ ok: boolean; processed: number; message: string }>(
      `/connections/${id}/sync`,
      {},
      { ok: true, processed: 0, message: "Sincronização concluída com sucesso." }
    );
  },

  /** POST /connections/sync — sincronização geral de todas as conexões ativas (php artisan connections:sync) */
  syncAll: async () => {
    return apiPost<{ ok: boolean; total_connections: number; processed: number; message: string }>(
      "/connections/sync",
      {},
      { ok: true, total_connections: 1, processed: 0, message: "Sincronização concluída com sucesso." }
    );
  },
};

export const connectionsQuery = queryOptions({ queryKey: ["connections"], queryFn: connectionsService.list, staleTime: 60_000 });
