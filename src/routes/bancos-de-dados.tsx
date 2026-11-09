import { createFileRoute } from "@tanstack/react-router";
import { ConnectionsPage } from "@/pages/ConnectionsPage";

export const Route = createFileRoute("/bancos-de-dados")({
  head: () => ({
    meta: [
      { title: "Bancos de dados — FinanceControl" },
      { name: "description", content: "Conexões de consulta somente leitura por unidade." },
      { property: "og:title", content: "Bancos de dados — FinanceControl" },
      { property: "og:description", content: "Conexões de consulta somente leitura por unidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConnectionsPage,
});
