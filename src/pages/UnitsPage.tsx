import { useState, useEffect } from "react";
import { Building2, Database, Plus, Pencil, Trash2, Loader2, ShieldAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/finance/PageHeader";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { SimpleSelect } from "@/components/finance/Selectors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useFilters } from "@/hooks/use-filters";
import { useFinanceData } from "@/hooks/use-finance-data";
import { unitsService } from "@/services/units.service";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Unit } from "@/types";

type UnitDraft = {
  id?: string;
  name: string;
  code: string;
  description: string;
  active: boolean;
};

const emptyUnit = (): UnitDraft => ({
  name: "",
  code: "",
  description: "",
  active: true,
});

export function UnitsPage() {
  const f = useFilters();
  const queryClient = useQueryClient();
  const { units: initialUnits, connections } = useFinanceData();

  const [list, setList] = useState<Unit[]>(initialUnits);
  const [draft, setDraft] = useState<UnitDraft | null>(null);
  const [del, setDel] = useState<Unit | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setList(initialUnits);
  }, [initialUnits]);

  const save = async () => {
    if (!draft) return;
    const name = draft.name.trim();
    const code = draft.code.trim().toUpperCase();

    if (!name || !code) {
      toast.error("Preencha o nome e o código da unidade.");
      return;
    }

    setIsSaving(true);
    try {
      if (draft.id) {
        const updated = await unitsService.update(draft.id, {
          name,
          code,
          description: draft.description.trim(),
          active: draft.active,
        });

        setList((current) =>
          current.map((u) => (u.id === draft.id ? { ...u, ...updated, name, code, active: draft.active } : u))
        );
        toast.success(`Unidade "${name}" atualizada com sucesso.`);
      } else {
        const created = await unitsService.create({
          name,
          code,
          description: draft.description.trim(),
          active: draft.active,
        });

        const newUnit: Unit = {
          id: created.id || `u${Date.now()}`,
          name: created.name || name,
          code: created.code || code,
          description: created.description ?? draft.description.trim(),
          active: created.active ?? draft.active,
        };

        setList((current) => [...current, newUnit]);
        toast.success(`Unidade "${name}" criada com sucesso.`);
      }

      await queryClient.invalidateQueries({ queryKey: ["units"] });
      setDraft(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar unidade.";
      toast.error("Falha ao salvar", { description: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (!del) return;

    // Verifica se há conexões vinculadas a esta unidade
    const linkedConns = connections.filter((c) => c.unitId === del.id);
    if (linkedConns.length > 0) {
      toast.error("Não é possível excluir esta unidade", {
        description: `Existem ${linkedConns.length} conexão(ões) vinculada(s) a esta unidade. Remova as conexões primeiro.`,
      });
      setDel(null);
      return;
    }

    setIsDeleting(true);
    try {
      await unitsService.delete(del.id);
      setList((current) => current.filter((u) => u.id !== del.id));

      if (f.unitId === del.id) {
        f.setUnitId("all");
      }

      await queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success(`Unidade "${del.name}" excluída com sucesso.`);
      setDel(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir unidade.";
      toast.error("Falha ao excluir", { description: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  const visibleUnits = list.filter((u) => f.unitId === "all" || u.id === f.unitId);
  const data = visibleUnits.map((u) => ({
    u,
    conns: connections.filter((c) => c.unitId === u.id),
  }));

  return (
    <>
      <PageHeader
        title="Unidades"
        description="Gerenciamento das unidades organizacionais APAC e seus bancos vinculados."
        actions={
          <Button onClick={() => setDraft(emptyUnit())} className="gap-2">
            <Plus className="size-4" /> Nova unidade
          </Button>
        }
      />

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center bg-card/50">
          <Building2 className="size-12 text-muted-foreground/60 mb-3" />
          <h3 className="text-base font-semibold">Nenhuma unidade cadastrada</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            Clique no botão acima para cadastrar a primeira unidade da organização.
          </p>
          <Button onClick={() => setDraft(emptyUnit())} className="mt-4 gap-2" variant="outline">
            <Plus className="size-4" /> Cadastrar unidade
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map(({ u, conns }) => (
            <article
              key={u.id}
              className={cn(
                "group relative flex flex-col justify-between rounded-xl border bg-card p-5 shadow-card transition-all hover:border-sidebar-border hover:shadow-md",
                f.unitId === u.id && "ring-2 ring-primary"
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="size-5" />
                    </span>
                    <div>
                      <h2 className="font-semibold leading-tight">{u.name}</h2>
                      <p className="font-mono text-xs text-muted-foreground">{u.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={u.active ? "Ativa" : "Inativa"} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground"
                      aria-label="Editar unidade"
                      onClick={() =>
                        setDraft({
                          id: u.id,
                          name: u.name,
                          code: u.code,
                          description: u.description || "",
                          active: u.active,
                        })
                      }
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      aria-label="Excluir unidade"
                      onClick={() => setDel(u)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                  {u.description || "Sem descrição cadastrada."}
                </p>

                <div className="mt-4 border-t pt-3">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
                    <span>Bancos conectados</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                      {conns.length}
                    </span>
                  </div>
                  {conns.length === 0 ? (
                    <p className="text-xs italic text-muted-foreground">Nenhuma conexão vinculada</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {conns.map((c) => (
                        <li key={c.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="flex items-center gap-1.5 truncate">
                            <Database className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{c.name}</span>
                          </span>
                          <StatusBadge status={c.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="mt-5 flex gap-2 border-t pt-3">
                <Button size="sm" variant="ghost" className="flex-1 text-xs" asChild>
                  <Link to="/" onClick={() => f.setUnitId(u.id)}>
                    Ver dashboard
                  </Link>
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs gap-1.5" asChild>
                  <Link to="/bancos-de-dados" onClick={() => f.setUnitId(u.id)}>
                    <Database className="size-3.5" /> Conexões
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição de Unidade */}
      <Dialog open={!!draft} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Editar Unidade" : "Nova Unidade"}</DialogTitle>
            <DialogDescription>
              {draft?.id
                ? "Atualize as informações cadastrais da unidade."
                : "Cadastre uma nova unidade organizacional no FinanceControl."}
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="unit-name">Nome da Unidade *</Label>
                <Input
                  id="unit-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Ex: Unidade Bacabal"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="unit-code">Código da Unidade *</Label>
                  <Input
                    id="unit-code"
                    value={draft.code}
                    onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                    placeholder="Ex: BCB-006"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="unit-status">Status</Label>
                  <SimpleSelect
                    label="Status"
                    className="sm:w-full"
                    value={draft.active ? "true" : "false"}
                    onChange={(v) => setDraft({ ...draft, active: v === "true" })}
                    options={[
                      { value: "true", label: "Ativa" },
                      { value: "false", label: "Inativa" },
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="unit-desc">Descrição</Label>
                <Textarea
                  id="unit-desc"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Finalidade operacional ou polo regional da unidade..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              {draft?.id ? "Salvar alterações" : "Criar unidade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <AlertDialog open={!!del} onOpenChange={(open) => !open && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-5" />
              <AlertDialogTitle>Excluir Unidade?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2">
              <p>
                Tem certeza que deseja excluir a unidade <strong>"{del?.name}"</strong> ({del?.code})?
              </p>
              <p className="text-xs text-muted-foreground">
                Esta ação remove o cadastro da unidade no FinanceControl. Caso existam bancos de dados vinculados, eles deverão ser removidos previamente.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={remove}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
              Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
