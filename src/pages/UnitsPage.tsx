import { Building2, Database } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/finance/PageHeader";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { Button } from "@/components/ui/button";
import { useFilters } from "@/hooks/use-filters";
import { useFinanceData } from "@/hooks/use-finance-data";
import { cn } from "@/lib/utils";

export function UnitsPage() {
  const f = useFilters();
  const { units, connections } = useFinanceData();
  const data = units.filter((u) => f.unitId === "all" || u.id === f.unitId).map((u) => ({ u, conns: connections.filter((c) => c.unitId === u.id) }));

  return (
    <>
      <PageHeader title="Unidades" description="Unidades da organização e seus bancos vinculados." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.map(({ u, conns }) => (
          <article key={u.id} className={cn("rounded-xl border bg-card p-5 shadow-card transition", f.unitId === u.id && "ring-2 ring-highlight")}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary"><Building2 className="size-5" /></span>
                <div>
                  <h2 className="font-semibold">{u.name}</h2>
                  <p className="font-mono text-xs text-muted-foreground">{u.code}</p>
                </div>
              </div>
              <StatusBadge status={u.active ? "Ativa" : "Inativa"} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{u.description}</p>
            <ul className="mt-4 space-y-1.5">
              {conns.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1.5"><Database className="size-3.5 text-muted-foreground" />{c.name}</span>
                  <StatusBadge status={c.status} />
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="ghost" asChild>
                <Link to="/" onClick={() => f.setUnitId(u.id)}>Ver dashboard</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/bancos-de-dados" onClick={() => f.setUnitId(u.id)}><Database /> Ver conexões</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
