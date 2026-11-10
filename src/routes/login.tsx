import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/pages/LoginPage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Acessar Sistema — FinanceControl" },
      { name: "description", content: "Autenticação de usuários do FinanceControl APAC." },
      { property: "og:title", content: "Acessar Sistema — FinanceControl" },
      { property: "og:description", content: "Autenticação de usuários do FinanceControl APAC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

