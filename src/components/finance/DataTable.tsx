import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  rowClassName?: (row: T) => string | undefined;
  emptyText?: string;
}

export function DataTable<T>({ rows, columns, rowKey, onRowClick, pageSize = 12, rowClassName, emptyText = "Nenhum registro encontrado para os filtros selecionados." }: Props<T>) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  useEffect(() => setPage(0), [rows.length]);
  const slice = rows.slice(page * pageSize, page * pageSize + pageSize);

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-14 text-center text-sm text-muted-foreground">
        <Inbox className="size-8 opacity-60" />
        {emptyText}
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/70">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={cn("whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground", c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left")}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn("border-t transition-colors", onRowClick && "cursor-pointer hover:bg-accent/60", rowClassName?.(row))}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("whitespace-nowrap px-3 py-2.5", c.align === "right" && "text-right tabular", c.align === "center" && "text-center", c.className)}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {page * pageSize + 1}–{Math.min(rows.length, (page + 1) * pageSize)} de {rows.length} registros
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-8" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Página anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="px-2">
            {page + 1} / {pages}
          </span>
          <Button variant="outline" size="icon" className="size-8" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} aria-label="Próxima página">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
