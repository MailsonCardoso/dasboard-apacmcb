import { createFileRoute } from "@tanstack/react-router";
import { ComparePage } from "@/pages/ComparePage";

export const Route = createFileRoute("/comparativo")({
  head: () => ({
    meta: [
      { title: "Comparativo entre unidades — FinanceControl" },
      { name: "description", content: "Compare receitas, despesas e saldos entre unidades." },
      { property: "og:title", content: "Comparativo entre unidades — FinanceControl" },
      { property: "og:description", content: "Compare receitas, despesas e saldos entre unidades." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComparePage,
});
