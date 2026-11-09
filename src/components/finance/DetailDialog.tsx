import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DetailDialog({ open, onOpenChange, title, subtitle, items }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; subtitle?: string; items: { label: string; value: ReactNode }[] }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {items.map((i) => (
            <div key={i.label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{i.label}</dt>
              <dd className="truncate font-medium">{i.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          <Lock className="size-3.5" /> Registro consultado do banco de origem em modo somente leitura.
        </p>
      </DialogContent>
    </Dialog>
  );
}
