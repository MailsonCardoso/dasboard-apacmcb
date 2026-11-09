import { createFileRoute } from "@tanstack/react-router";
import { ExpensesPage } from "@/pages/ExpensesPage";

export const Route = createFileRoute("/despesas")({
  head: () => ({
    meta: [
      { title: "Despesas — FinanceControl" },
      { name: "description", content: "Consulta de despesas pagas, pendentes e vencidas." },
      { property: "og:title", content: "Despesas — FinanceControl" },
      { property: "og:description", content: "Consulta de despesas pagas, pendentes e vencidas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExpensesPage,
});
