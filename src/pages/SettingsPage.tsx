import { ShieldCheck, Server, Lock, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/finance/PageHeader";
import { API_URL } from "@/services/http";

const RULES = [
  "O navegador nunca conecta diretamente aos bancos de dados.",
  "Credenciais ficam somente no backend (Laravel), nunca no navegador.",
  "Usuários de banco com privilégio exclusivo de leitura (SELECT).",
  "Comandos INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE e CREATE bloqueados.",
  "Sem execução de SQL arbitrário; apenas consultas parametrizadas.",
  "Controle de acesso por unidade para cada usuário.",
];

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Configurações" description="Preferências da aplicação e políticas de segurança." readOnly={false} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Preferências">
          <div className="space-y-4">
            {[
              ["Alertar conexões indisponíveis", true],
              ["Destacar despesas vencidas", true],
              ["Abrir dashboard com todas as unidades", true],
              ["Resumo semanal por e-mail (em breve)", false],
            ].map(([l, v]) => (
              <div key={String(l)} className="flex items-center justify-between gap-4">
                <Label>{l}</Label>
                <Switch defaultChecked={Boolean(v)} />
              </div>
            ))}
            <Button onClick={() => toast.success("Preferências salvas para esta sessão.")}>Salvar preferências</Button>
          </div>
        </Panel>
        <Panel title="Integração" description="Preparado para a API REST Laravel">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center gap-2"><Server className="size-4 text-muted-foreground" /><dt className="text-muted-foreground">Endereço da API:</dt><dd className="font-mono">{API_URL}</dd></div>
            <div className="flex items-center gap-2"><KeyRound className="size-4 text-muted-foreground" /><dt className="text-muted-foreground">Modo de dados:</dt><dd className="font-medium">Simulado (demonstração)</dd></div>
            <div className="flex items-center gap-2"><Lock className="size-4 text-muted-foreground" /><dt className="text-muted-foreground">Acesso aos bancos:</dt><dd className="font-medium">Somente leitura</dd></div>
          </dl>
        </Panel>
        <Panel title="Políticas de segurança" className="lg:col-span-2">
          <ul className="grid gap-2 sm:grid-cols-2">
            {RULES.map((r) => (
              <li key={r} className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-income" /> {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
