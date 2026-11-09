import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/pages/SettingsPage";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — FinanceControl" },
      { name: "description", content: "Preferências e políticas de segurança do FinanceControl." },
      { property: "og:title", content: "Configurações — FinanceControl" },
      { property: "og:description", content: "Preferências e políticas de segurança do FinanceControl." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});
