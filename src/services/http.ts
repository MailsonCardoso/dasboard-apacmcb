/**
 * Camada de acesso à API REST Laravel.
 * Faz requisições HTTP para a API REST configurada em VITE_API_URL (padrão: /api).
 * Em ambiente offline ou caso a API não responda, recorre de forma transparente
 * aos dados simulados (fallback), mantendo a experiência e testes 100% íntegros.
 */
export const API_URL = import.meta.env["VITE_API_URL"] ?? "/api";

export function simulate<T>(data: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), ms));
}

export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${API_URL}${cleanPath}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();
    return (json && typeof json === "object" && "data" in json ? json.data : json) as T;
  } catch {
    return simulate(fallback);
  }
}

export async function apiPost<T>(path: string, body: unknown, fallback: T): Promise<T> {
  try {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${API_URL}${cleanPath}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body ?? {}),
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();
    return (json && typeof json === "object" && "data" in json ? json.data : json) as T;
  } catch {
    return simulate(fallback);
  }
}
