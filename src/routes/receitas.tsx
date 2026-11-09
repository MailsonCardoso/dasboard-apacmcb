import { createFileRoute } from "@tanstack/react-router";
import { IncomesPage } from "@/pages/IncomesPage";

export const Route = createFileRoute("/receitas")({
  head: () => ({
    meta: [
      { title: "Receitas — FinanceControl" },
      { name: "description", content: "Consulta de receitas recebidas e pendentes." },
      { property: "og:title", content: "Receitas — FinanceControl" },
      { property: "og:description", content: "Consulta de receitas recebidas e pendentes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IncomesPage,
});
