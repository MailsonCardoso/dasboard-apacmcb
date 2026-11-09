import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart,
} from "recharts";
import { formatBRL, formatCompactBRL } from "@/utils/format";

const C = {
  income: "var(--income)",
  expense: "var(--expense)",
  highlight: "var(--highlight)",
  grid: "var(--border)",
  axis: "var(--muted-foreground)",
};
export const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--highlight-soft)", "var(--muted-foreground)", "var(--primary)"];

const tooltipStyle = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 },
  formatter: (v: number) => formatBRL(v),
};
const axis = { stroke: C.axis, fontSize: 12, tickLine: false, axisLine: false };

export function IncomeExpenseBars({ data, height = 280 }: { data: { label: string; receitas: number; despesas: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barGap={4} barSize={12}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} tickFormatter={formatCompactBRL} width={70} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "var(--muted)" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="receitas" name="Receitas" fill={C.income} radius={[4, 4, 0, 0]} />
        <Bar dataKey="despesas" name="Despesas" fill={C.expense} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BalanceLine({ data, height = 320 }: { data: { label: string; saldo: number; acumulado: number }[]; height?: number }) {
  // Reserve a full currency label's width per month, even on narrow screens.
  const longestLabel = Math.max(0, ...data.flatMap((row) => [formatBRL(row.saldo).length, formatBRL(row.acumulado).length]));
  const columnWidth = Math.max(112, longestLabel * 7.2 + 24);
  const chartWidth = Math.max(1440, Math.max(1, data.length - 1) * columnWidth + 210);
  const renderLabel = (series: "saldo" | "acumulado") => (props: { viewBox?: unknown; value?: unknown; index?: number }) => {
    const box = props.viewBox;
    const row = typeof props.index === "number" ? data[props.index] : undefined;
    if (!row || typeof props.value !== "number" || !box || typeof box !== "object" || !("x" in box) || !("y" in box) || typeof box.x !== "number" || typeof box.y !== "number") return null;
    // Place the upper series above its point and the lower series below it.
    // Equal balances get opposite positions, so both labels remain readable.
    const above = series === "acumulado" ? row.acumulado >= row.saldo : row.saldo > row.acumulado;
    return (
      <text
        className={`recharts-label font-mono ${props.value < 0 ? "fill-destructive" : series === "saldo" ? "fill-income" : "fill-highlight"}`}
        x={box.x}
        y={box.y + (above ? -18 : 22)}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={12}
        stroke="var(--background)"
        strokeWidth={3}
        paintOrder="stroke"
      >
        {formatBRL(props.value)}
      </text>
    );
  };
  return (
    <div className="space-y-3">
      <ul aria-label="Legenda dos saldos" className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium">
        <li className="flex items-center gap-2 text-income">
          <svg width="36" height="14" viewBox="0 0 36 14" aria-hidden="true" className="shrink-0">
            <path d="M0 7H36" stroke="currentColor" strokeWidth="3" strokeDasharray="6 4" />
            <circle cx="18" cy="7" r="4" fill="currentColor" />
          </svg>
          Saldo mensal
        </li>
        <li className="flex items-center gap-2 text-highlight">
          <svg width="36" height="14" viewBox="0 0 36 14" aria-hidden="true" className="shrink-0">
            <path d="M0 7H36" stroke="currentColor" strokeWidth="3" />
            <circle cx="18" cy="7" r="4" fill="currentColor" />
          </svg>
          Saldo acumulado
        </li>
      </ul>
    <div className="overflow-x-auto" role="region" aria-label="Evolução do saldo mensal e acumulado" tabIndex={0}>
      <div style={{ minWidth: chartWidth }}>
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 40, right: 90, bottom: 45, left: 50 }}>
        <defs>
          <linearGradient id="accFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.highlight} stopOpacity={0.12} />
            <stop offset="100%" stopColor={C.highlight} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="label" {...axis} interval={0} tickMargin={14} />
        <YAxis {...axis} tickFormatter={formatCompactBRL} width={70} />
        <Tooltip {...tooltipStyle} />
        <Area type="monotone" dataKey="acumulado" name="Saldo acumulado" stroke={C.highlight} strokeWidth={3} fill="url(#accFill)" dot={{ r: 4, fill: C.highlight }}>
          <LabelList dataKey="acumulado" content={renderLabel("acumulado")} />
        </Area>
        <Area type="monotone" dataKey="saldo" name="Saldo mensal" stroke={C.income} strokeWidth={3} fill="none" strokeDasharray="6 4" dot={{ r: 4, fill: C.income }}>
          <LabelList dataKey="saldo" content={renderLabel("saldo")} />
        </Area>
      </AreaChart>
    </ResponsiveContainer>
      </div>
    </div>
    </div>
  );
}

export function CategoryDonut({ data, height = 260 }: { data: { name: string; value: number }[]; height?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="w-full sm:w-1/2">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="90%" paddingAngle={2} stroke="var(--card)">
              {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-3 text-sm sm:w-1/2">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-2 border-b border-border/60 pb-2 last:border-0">
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
              <span className="truncate">{d.name}</span>
            </span>
            <span className="tabular text-muted-foreground">{total ? ((d.value / total) * 100).toFixed(1).replace(".", ",") : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function UnitsCompareBars({ data, height = 300 }: { data: { label: string; receitas: number; despesas: number; saldo: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} tickFormatter={formatCompactBRL} width={70} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "var(--muted)" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="receitas" name="Receitas" fill={C.income} radius={[4, 4, 0, 0]} />
        <Bar dataKey="despesas" name="Despesas" fill={C.expense} radius={[4, 4, 0, 0]} />
        <Bar dataKey="saldo" name="Saldo" fill={C.highlight} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MultiLine({ data, series, height = 300 }: { data: Record<string, number | string>[]; series: string[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} tickFormatter={formatCompactBRL} width={70} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => <Line key={s} type="monotone" dataKey={s} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={false} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}
