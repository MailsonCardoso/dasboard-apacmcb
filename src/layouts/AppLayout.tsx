import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell, BarChart3, Building2, Database, FileBarChart, GitCompareArrows, LayoutDashboard, Settings, TrendingDown, TrendingUp, Waves, ShieldCheck, LogOut, User,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UnitSelect, CompetenceSelect } from "@/components/finance/Selectors";
import { useFilters } from "@/hooks/use-filters";
import { useFinanceData } from "@/hooks/use-finance-data";
import { formatDateTime } from "@/utils/format";

const nav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Bancos de Dados", url: "/bancos-de-dados", icon: Database },
  { title: "Unidades", url: "/unidades", icon: Building2 },
  { title: "Receitas", url: "/receitas", icon: TrendingUp },
  { title: "Despesas", url: "/despesas", icon: TrendingDown },
  { title: "Fluxo de Caixa", url: "/fluxo-de-caixa", icon: Waves },
  { title: "Relatórios", url: "/relatorios", icon: FileBarChart },
  { title: "Comparativo", url: "/comparativo", icon: GitCompareArrows },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
] as const;

function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-1 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <BarChart3 className="size-5" />
          </span>
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <p className="font-display text-base font-semibold text-sidebar-accent-foreground">FinanceControl</p>
            <p className="text-[11px] opacity-70">Gestão multiunidade</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={path === item.url} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent p-2.5 text-xs group-data-[collapsible=icon]:hidden">
          <ShieldCheck className="size-4 shrink-0 text-sidebar-primary" />
          <span>Acesso somente leitura aos bancos de origem</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function Notifications() {
  const { connections } = useFinanceData();
  const { expenses } = useFinanceData();
  const issues = connections.filter((c) => c.status !== "online");
  const overdue = expenses.filter((e) => e.status === "Vencida").length;
  const count = issues.length + (overdue ? 1 : 0);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell />
          {count > 0 && <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-expense text-[10px] font-semibold text-primary-foreground">{count}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {issues.map((c) => (
          <DropdownMenuItem key={c.id} className="flex-col items-start gap-0.5">
            <span className="font-medium">{c.status === "offline" ? "Conexão indisponível" : "Conexão instável"}: {c.name}</span>
            <span className="text-xs text-muted-foreground">Última verificação {formatDateTime(c.lastCheck)}</span>
          </DropdownMenuItem>
        ))}
        {overdue > 0 && (
          <DropdownMenuItem className="flex-col items-start gap-0.5">
            <span className="font-medium">{overdue} despesas vencidas</span>
            <span className="text-xs text-muted-foreground">Identificadas nas consultas das unidades</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const f = useFilters();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-background">
          <header className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b bg-card/90 px-4 py-2.5 backdrop-blur">
            <SidebarTrigger />
            <span className="hidden font-display font-semibold md:inline">FinanceControl</span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <UnitSelect value={f.unitId} onChange={f.setUnitId} className="h-9 sm:w-48" />
              <CompetenceSelect year={f.year} month={f.month} onYear={f.setYear} onMonth={f.setMonth} />
              <Notifications />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2" aria-label="Perfil do usuário">
                    <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">MC</span>
                    <span className="hidden text-left text-xs leading-tight lg:block">
                      <span className="block font-medium">Mailson Cardoso</span>
                      <span className="text-muted-foreground">Controller</span>
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/configuracoes"><User /> Perfil e preferências</Link></DropdownMenuItem>
                  <DropdownMenuItem disabled><LogOut /> Sair (demonstração)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="mx-auto w-full min-w-0 max-w-[1400px] flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
