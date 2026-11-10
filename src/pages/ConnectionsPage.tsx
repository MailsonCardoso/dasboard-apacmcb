import { useState } from "react";
import { Eye, EyeOff, Info, Loader2, Pencil, Plug, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader, Panel } from "@/components/finance/PageHeader";
import { DataTable, type Column } from "@/components/finance/DataTable";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { SimpleSelect } from "@/components/finance/Selectors";
import { useFinanceData } from "@/hooks/use-finance-data";
import { useFilters } from "@/hooks/use-filters";
import { connectionsService } from "@/services/connections.service";
import { formatDateTime } from "@/utils/format";
import type { DbConnection, DbType } from "@/types";

const TYPES: DbType[] = ["MySQL", "MariaDB", "PostgreSQL", "SQL Server", "Oracle"];
const DEFAULT_PORT: Record<DbType, number> = { MySQL: 3306, MariaDB: 3306, PostgreSQL: 5432, "SQL Server": 1433, Oracle: 1521 };

type Draft = Omit<DbConnection, "id" | "lastCheck" | "passwordMask"> & { id?: string; password: string };
const empty = (unitId: string): Draft => ({ name: "", unitId, type: "MySQL", host: "", port: 3306, database: "", user: "", password: "", description: "", status: "online" });

export function ConnectionsPage() {
  const queryClient = useQueryClient();
  const { unitId } = useFilters();
  const { connections: initial, units, unitName } = useFinanceData();
  // Somente o cadastro de configuração do FinanceControl (em memória). Senhas nunca são persistidas no navegador.
  const [list, setList] = useState<DbConnection[]>(initial);
  const [view, setView] = useState<DbConnection | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [del, setDel] = useState<DbConnection | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const test = async (c: DbConnection) => {
    setTesting(c.id);
    const res = await connectionsService.test(c);
    setTesting(null);
    const now = new Date().toISOString().slice(0, 19);
    setList((l) => l.map((x) => (x.id === c.id ? { ...x, lastCheck: now } : x)));
    res.ok ? toast.success(`${c.name}: ${res.message}`) : toast.error(`${c.name}: ${res.message}`);
  };

  const sync = async (c: DbConnection) => {
    setSyncing(c.id);
    try {
      const res = await connectionsService.sync(c.id);
      const now = new Date().toISOString().slice(0, 19);
      setList((l) => l.map((x) => (x.id === c.id ? { ...x, lastCheck: now } : x)));
      if (res.ok) {
        toast.success(`${c.name}: ${res.message}`);
        queryClient.invalidateQueries();
      } else {
        toast.error(`${c.name}: ${res.message}`);
      }
    } catch {
      toast.error(`${c.name}: Erro ao executar sincronização.`);
    } finally {
      setSyncing(null);
    }
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.name || !draft.host || !draft.database || !draft.user) {
      toast.error("Preencha nome, servidor, banco e usuário.");
      return;
    }
    const { password, ...rest } = draft;
    const mask = password ? "•".repeat(Math.max(8, password.length)) : undefined;
    if (draft.id) {
      const updated = await connectionsService.update(draft.id, draft);
      setList((l) => l.map((x) => (x.id === draft.id ? { ...x, ...rest, ...updated, passwordMask: mask ?? x.passwordMask } : x)));
      toast.success("Configuração da conexão atualizada.");
    } else {
      const created = await connectionsService.create(draft);
      const newConn = {
        ...rest,
        ...created,
        id: created.id || `c${Date.now()}`,
        passwordMask: mask ?? "••••••••",
        lastCheck: created.lastCheck || new Date().toISOString().slice(0, 19),
      };
      setList((l) => [...l, newConn]);
      toast.success("Conexão cadastrada no FinanceControl.");
    }
    setDraft(null);
  };

  const remove = async () => {
    if (!del) return;
    await connectionsService.delete(del.id);
    setList((l) => l.filter((x) => x.id !== del.id));
    toast.success(`Conexão ${del.name} removida.`);
    setDel(null);
  };

  const columns: Column<DbConnection>[] = [
    { key: "name", header: "Conexão", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "unit", header: "Unidade", render: (r) => unitName(r.unitId) },
    { key: "host", header: "IP/Servidor", render: (r) => <span className="font-mono text-xs">{r.host}:{r.port}</span> },
    { key: "db", header: "Banco", render: (r) => <span className="font-mono text-xs">{r.database}</span> },
    { key: "type", header: "Tipo", render: (r) => r.type },
    { key: "user", header: "Usuário", render: (r) => <span className="font-mono text-xs">{r.user}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "check", header: "Última verificação", render: (r) => <span className="text-xs">{formatDateTime(r.lastCheck)}</span> },
    {
      key: "actions", header: "Ações", align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="size-8" title="Detalhes da conexão" aria-label="Detalhes" onClick={() => { setShowPwd(false); setView(r); }}><Info /></Button>
          <Button variant="ghost" size="icon" className="size-8" title="Testar conectividade" aria-label="Testar conexão" onClick={() => test(r)} disabled={testing === r.id}>
            {testing === r.id ? <Loader2 className="animate-spin" /> : <Plug />}
          </Button>
          <Button variant="ghost" size="icon" className="size-8 text-primary" title="Sincronizar dados remotos" aria-label="Sincronizar dados" onClick={() => sync(r)} disabled={syncing === r.id}>
            {syncing === r.id ? <Loader2 className="animate-spin" /> : <RefreshCw className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="size-8" title="Editar configuração" aria-label="Editar configuração" onClick={() => setDraft({ ...r, password: "" })}><Pencil /></Button>
          <Button variant="ghost" size="icon" className="size-8 text-expense" title="Excluir conexão" aria-label="Excluir cadastro" onClick={() => setDel(r)}><Trash2 /></Button>
        </div>
      ),
    },
  ];

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  return (
    <>
      <PageHeader
        title="Bancos de dados"
        description="Conexões de consulta configuradas para cada unidade."
        readOnly={false}
        actions={<Button onClick={() => setDraft(empty(unitId === "all" ? units[0]?.id ?? "" : unitId))}><Plus /> Nova conexão</Button>}
      />
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-highlight/30 bg-highlight-soft p-3 text-sm text-accent-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-highlight" />
        <p>Editar ou excluir uma conexão altera apenas o cadastro de configuração do FinanceControl — nunca os dados do banco de origem. Use sempre usuários com privilégio exclusivo de leitura (SELECT).</p>
      </div>
      <Panel>
        <DataTable rows={list.filter((c) => unitId === "all" || c.unitId === unitId)} columns={columns} rowKey={(r) => r.id} rowClassName={(r) => (r.status === "offline" ? "bg-expense-soft/40" : undefined)} />
      </Panel>

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{view?.name}</DialogTitle>
            <DialogDescription>{view?.description}</DialogDescription>
          </DialogHeader>
          {view && (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Unidade", unitName(view.unitId)], ["Tipo", view.type], ["Servidor", view.host], ["Porta", String(view.port)],
                ["Banco", view.database], ["Usuário", view.user], ["Última verificação", formatDateTime(view.lastCheck)],
              ].map(([l, v]) => (
                <div key={l}><dt className="text-xs text-muted-foreground">{l}</dt><dd className="font-medium">{v}</dd></div>
              ))}
              <div><dt className="text-xs text-muted-foreground">Status</dt><dd><StatusBadge status={view.status} /></dd></div>
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Senha</dt>
                <dd className="flex items-center gap-2">
                  <span className="font-mono">{showPwd ? "(armazenada apenas no servidor)" : view.passwordMask}</span>
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => setShowPwd(!showPwd)} aria-label={showPwd ? "Ocultar senha" : "Revelar senha"}>
                    {showPwd ? <EyeOff /> : <Eye />}
                  </Button>
                </dd>
              </div>
            </dl>
          )}
          {view && (
            <DialogFooter className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => test(view)} disabled={testing === view.id}>
                {testing === view.id ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Plug className="mr-1 size-4" />}
                Testar conexão
              </Button>
              <Button size="sm" onClick={() => sync(view)} disabled={syncing === view.id}>
                {syncing === view.id ? <Loader2 className="mr-1 size-4 animate-spin" /> : <RefreshCw className="mr-1 size-4" />}
                Sincronizar dados
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Editar configuração da conexão" : "Nova conexão"}</DialogTitle>
            <DialogDescription>Credenciais devem ter acesso somente leitura. Serão enviadas ao backend, nunca guardadas no navegador.</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome da conexão"><Input value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Banco Financeiro Matriz" /></Field>
              <Field label="Unidade vinculada"><SimpleSelect label="Unidade" className="sm:w-full" value={draft.unitId} onChange={(v) => set("unitId", v)} options={units.map((u) => ({ value: u.id, label: u.name }))} /></Field>
              <Field label="Tipo de banco"><SimpleSelect label="Tipo" className="sm:w-full" value={draft.type} onChange={(v) => { set("type", v as DbType); set("port", DEFAULT_PORT[v as DbType]); }} options={TYPES.map((t) => ({ value: t, label: t }))} /></Field>
              <Field label="IP ou hostname"><Input value={draft.host} onChange={(e) => set("host", e.target.value)} placeholder="192.168.1.100" /></Field>
              <Field label="Porta"><Input type="number" value={draft.port} onChange={(e) => set("port", Number(e.target.value))} /></Field>
              <Field label="Nome do banco"><Input value={draft.database} onChange={(e) => set("database", e.target.value)} placeholder="financeiro_db" /></Field>
              <Field label="Usuário"><Input value={draft.user} onChange={(e) => set("user", e.target.value)} placeholder="consulta_financeira" autoComplete="off" /></Field>
              <Field label={draft.id ? "Senha (deixe vazio para manter)" : "Senha"}><Input type="password" value={draft.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" /></Field>
              <Field label="Status"><SimpleSelect label="Status" className="sm:w-full" value={draft.status} onChange={(v) => set("status", v as Draft["status"])} options={[{ value: "online", label: "Online" }, { value: "instavel", label: "Instável" }, { value: "offline", label: "Indisponível" }]} /></Field>
              <div className="sm:col-span-2"><Field label="Descrição"><Textarea value={draft.description} onChange={(e) => set("description", e.target.value)} rows={2} /></Field></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>Cancelar</Button>
            <Button onClick={save}>Salvar configuração</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cadastro da conexão?</AlertDialogTitle>
            <AlertDialogDescription>
              "{del?.name}" deixará de ser consultada pelo FinanceControl. O banco de dados de origem e seus dados não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>
              Excluir cadastro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
