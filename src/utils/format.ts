const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const formatBRL = (v: number) => brl.format(v);

export const formatCompactBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(v);

/** YYYY-MM-DD ou ISO -> DD/MM/AAAA (sem depender de fuso) */
export function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  const [y, m, day] = d.slice(0, 10).split("-");
  return `${day}/${m}/${y}`;
}

export function formatDateTime(iso: string) {
  return `${formatDate(iso)} ${iso.slice(11, 16)}`;
}

export const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
export const MONTHS_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function formatPercent(v: number | null) {
  if (v === null || !isFinite(v)) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1).replace(".", ",")}%`;
}
