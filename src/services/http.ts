/**
 * Camada de acesso à API. Nesta etapa retorna dados simulados.
 * Futuro: substituir `simulate` por fetch(`${API_URL}/...`) para a API REST Laravel,
 * que é a única responsável pelas conexões (somente SELECT, usuários read-only,
 * consultas parametrizadas). O navegador nunca conecta diretamente aos bancos.
 */
export const API_URL = import.meta.env.VITE_API_URL ?? "/api";

export function simulate<T>(data: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), ms));
}
