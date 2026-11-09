import type { ReactNode } from "react";
import { Lock } from "lucide-react";

export function PageHeader({ title, description, actions, readOnly = true }: { title: string; description?: string; actions?: ReactNode; readOnly?: boolean }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-2xl font-semibold leading-snug md:text-3xl">{title}</h1>
          {readOnly && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Lock className="size-3" /> Somente leitura
            </span>
          )}
        </div>
        {description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, children, actions, className = "" }: { title?: string; description?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 border-t pt-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
