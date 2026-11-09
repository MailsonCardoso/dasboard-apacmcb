import { createFileRoute } from "@tanstack/react-router";
import { CashFlowPage } from "@/pages/CashFlowPage";

export const Route = createFileRoute("/fluxo-de-caixa")({
  head: () => ({
    meta: [
      { title: "Fluxo de caixa — FinanceControl" },
      { name: "description", content: "Movimentações financeiras cronológicas com saldo corrente." },
      { property: "og:title", content: "Fluxo de caixa — FinanceControl" },
      { property: "og:description", content: "Movimentações financeiras cronológicas com saldo corrente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CashFlowPage,
});
