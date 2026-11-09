import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reportsService, type ReportRow } from "@/services/reports.service";

export function ExportButtons({ rows, name, title, subtitle }: { rows: ReportRow[]; name: string; title: string; subtitle: string }) {
  const run = (fn: () => void, kind: string) => {
    if (!rows.length) return toast.error("Não há dados para exportar com os filtros atuais.");
    try {
      fn();
      toast.success(`${kind} gerado com ${rows.length} registros.`);
    } catch {
      toast.error(`Falha ao gerar ${kind}.`);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => run(() => reportsService.pdf(rows, name, title, subtitle), "PDF")}>
        <FileText /> PDF
      </Button>
      <Button variant="outline" size="sm" onClick={() => run(() => reportsService.excel(rows, name), "Excel")}>
        <FileSpreadsheet /> Excel
      </Button>
      <Button variant="outline" size="sm" onClick={() => run(() => reportsService.csv(rows, name), "CSV")}>
        <FileDown /> CSV
      </Button>
    </div>
  );
}
