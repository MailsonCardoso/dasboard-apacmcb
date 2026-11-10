import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BarChart3, Lock, Mail, Loader2, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@apacmcb.org.br");
  const [password, setPassword] = useState("Admin@2026!");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success("Autenticado com sucesso!", {
        description: "Bem-vindo ao FinanceControl APAC.",
      });
      navigate({ to: "/" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao efetuar login.";
      setError(msg);
      toast.error("Falha no login", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (type: "admin" | "controller") => {
    if (type === "admin") {
      setEmail("admin@apacmcb.org.br");
      setPassword("Admin@2026!");
    } else {
      setEmail("controller@apacmcb.org.br");
      setPassword("Admin@2026!");
    }
    setError(null);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <BarChart3 className="size-8" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">FinanceControl</h1>
          <p className="text-sm text-slate-400">Gestão financeira consolidada multiunidade APAC</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white">Acessar Sistema</CardTitle>
            <CardDescription className="text-slate-400">
              Informe seu e-mail institucional e senha de acesso.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/15 p-3 text-sm text-destructive-foreground">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@apacmcb.org.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-slate-700 bg-slate-950/60 pl-9 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-200">
                    Senha
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-slate-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-slate-700 bg-slate-950/60 pl-9 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400">
                <div className="mb-1.5 flex items-center gap-1.5 font-medium text-slate-300">
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                  <span>Acesso rápido para homologação:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleFillDemo("admin")}
                    className="rounded bg-slate-800 px-2 py-1 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    admin@apacmcb.org.br
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemo("controller")}
                    className="rounded bg-slate-800 px-2 py-1 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    controller@apacmcb.org.br
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full gap-2 font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    Entrar no Sistema
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
                <ShieldCheck className="size-3.5 text-slate-400" />
                <span>Conexão criptografada com a API Laravel</span>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
