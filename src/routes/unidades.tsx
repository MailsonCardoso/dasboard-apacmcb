import { createFileRoute } from "@tanstack/react-router";
import { UnitsPage } from "@/pages/UnitsPage";

export const Route = createFileRoute("/unidades")({
  head: () => ({
    meta: [
      { title: "Unidades — FinanceControl" },
      { name: "description", content: "Unidades da organização e seus resultados financeiros." },
      { property: "og:title", content: "Unidades — FinanceControl" },
      { property: "og:description", content: "Unidades da organização e seus resultados financeiros." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UnitsPage,
});
