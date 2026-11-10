import { API_URL, simulate } from "./http";

export interface AuthUser {
  id: number | string;
  nome: string;
  email: string;
  perfil?: string;
  unidades?: Array<{
    id: string;
    codigo: string;
    nome: string;
    perfilId: number;
  }>;
  preferencias?: {
    alertar_conexoes?: boolean;
    destacar_vencidas?: boolean;
    abrir_todas_unidades?: boolean;
    resumo_semanal_email?: boolean;
  };
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  user: AuthUser;
}

const TOKEN_KEY = "fc_auth_token";
const USER_KEY = "fc_auth_user";

export const authService = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  getUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? (JSON.parse(data) as AuthUser) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  setSession(token: string, user: AuthUser): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn("Não foi possível salvar a sessão no localStorage:", e);
    }
  },

  clearSession(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.warn("Não foi possível limpar a sessão:", e);
    }
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const resp: LoginResponse = {
          token: json.token,
          tokenType: json.tokenType || "Bearer",
          user: {
            id: json.user?.id ?? 1,
            nome: json.user?.nome ?? "Administrador APACMCB",
            email: json.user?.email ?? cleanEmail,
            perfil: json.user?.perfil ?? "Administrador",
            unidades: json.user?.unidades ?? [],
            preferencias: json.user?.preferencias ?? {},
          },
        };
        this.setSession(resp.token, resp.user);
        return resp;
      }

      // Se a resposta for 422 ou 401, credenciais incorretas na API
      if (res.status === 401 || res.status === 422) {
        const errJson = await res.json().catch(() => ({}));
        const msg =
          errJson.message ||
          (errJson.errors && Object.values(errJson.errors).flat().join(" ")) ||
          "E-mail ou senha incorretos.";
        throw new Error(msg);
      }
    } catch (err: unknown) {
      // Se for erro de validação da API, repassa
      if (err instanceof Error && !err.name.includes("AbortError") && !err.message.includes("Failed to fetch") && !err.message.includes("NetworkError")) {
        throw err;
      }
    }

    // Modo de demonstração / Fallback offline quando a API REST não estiver acessível
    if (
      (cleanEmail === "admin@apacmcb.org.br" && cleanPassword === "Admin@2026!") ||
      (cleanEmail === "controller@apacmcb.org.br" && cleanPassword === "Admin@2026!")
    ) {
      const isController = cleanEmail.startsWith("controller");
      const demoResponse: LoginResponse = {
        token: "fc_demo_token_" + Date.now(),
        tokenType: "Bearer",
        user: {
          id: isController ? 2 : 1,
          nome: isController ? "Mailson Cardoso" : "Administrador APACMCB",
          email: cleanEmail,
          perfil: isController ? "Controller" : "Administrador",
        },
      };
      this.setSession(demoResponse.token, demoResponse.user);
      return simulate(demoResponse);
    }

    throw new Error("Credenciais inválidas. Verifique seu e-mail e senha.");
  },

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
      } catch {
        // Ignora erro no logout para garantir limpeza local
      }
    }
    this.clearSession();
  },
};

