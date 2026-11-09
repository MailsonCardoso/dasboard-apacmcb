import type { ReactNode } from "react";
import { Lock } from "lucide-react";

export function PageHeader({ title, description, actions, readOnly = true }: { title: string; description?: string; actions?: ReactNode; readOnly?: boolean }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {readOnly && (
            <span className="inline-flex items-center gap-1 rounded-full bg-highlight-soft px-2 py-0.5 text-[11px] font-medium text-highlight">
              <Lock className="size-3" /> Somente leitura
            </span>
          )}
        </div>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, children, actions, className = "" }: { title?: string; description?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border bg-card p-5 shadow-card ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
