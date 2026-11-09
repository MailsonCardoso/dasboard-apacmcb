import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/pages/ReportsPage";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — FinanceControl" },
      { name: "description", content: "Relatórios gerenciais com exportação em PDF, Excel e CSV." },
      { property: "og:title", content: "Relatórios — FinanceControl" },
      { property: "og:description", content: "Relatórios gerenciais com exportação em PDF, Excel e CSV." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});
