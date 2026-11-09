import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type ReportRow = Record<string, string | number>;

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Exporta somente os dados retornados pelas consultas. */
export const reportsService = {
  csv(rows: ReportRow[], name: string) {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
    const body = [headers.map(esc).join(";"), ...rows.map((r) => headers.map((h) => esc(r[h])).join(";"))].join("\n");
    download(new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8" }), `${name}.csv`);
  },
  excel(rows: ReportRow[], name: string) {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, `${name}.xlsx`);
  },
  pdf(rows: ReportRow[], name: string, title: string, subtitle: string) {
    if (!rows.length) return;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`FinanceControl — ${title}`, 14, 16);
    doc.setFontSize(9);
    doc.text(subtitle, 14, 22);
    const headers = Object.keys(rows[0]);
    autoTable(doc, {
      startY: 28,
      head: [headers],
      body: rows.map((r) => headers.map((h) => String(r[h]))),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [24, 39, 84] },
    });
    doc.save(`${name}.pdf`);
  },
};
