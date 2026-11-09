import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/pages/DashboardPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard financeiro — FinanceControl" },
      { name: "description", content: "Receitas, despesas e saldos consolidados de todas as unidades." },
      { property: "og:title", content: "Dashboard financeiro — FinanceControl" },
      { property: "og:description", content: "Receitas, despesas e saldos consolidados de todas as unidades." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});
