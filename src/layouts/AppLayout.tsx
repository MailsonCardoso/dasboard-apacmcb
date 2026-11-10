import type { ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
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
import { useAuth } from "@/hooks/use-auth";
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
      <SidebarHeader className="border-b border-sidebar-border px-4 py-6 group-data-[collapsible=icon]:px-1">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <BarChart3 className="size-5" />
          </span>
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <p className="font-display text-base font-semibold text-sidebar-accent-foreground">FinanceControl</p>
            <p className="mt-1 text-xs opacity-80">Gestão multiunidade</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-1 py-3">
        {[
          { label: "Financeiro", items: nav.filter((item) => ["/", "/receitas", "/despesas", "/fluxo-de-caixa"].includes(item.url)) },
          { label: "Análise", items: nav.filter((item) => ["/relatorios", "/comparativo"].includes(item.url)) },
          { label: "Organização", items: nav.filter((item) => ["/unidades", "/bancos-de-dados", "/configuracoes"].includes(item.url)) },
        ].map((group) => (
        <SidebarGroup key={group.label} className="px-3 group-data-[collapsible=icon]:px-1">
          <SidebarGroupLabel className="mb-1 text-xs font-medium text-sidebar-foreground/80">{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={path === item.url} tooltip={item.title} className="h-11 rounded-md px-3 text-[15px] font-medium data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground">
                    <Link to={item.url}>
                      <item.icon className="opacity-80" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs leading-relaxed group-data-[collapsible=icon]:hidden">
          <ShieldCheck className="size-4 shrink-0 text-sidebar-foreground" />
          <span>Acesso somente leitura</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function Notifications() {
  const { connections, expenses } = useFinanceData();
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const showPeriod = !["/configuracoes", "/bancos-de-dados", "/unidades"].includes(path);
  const showUnit = !["/configuracoes", "/comparativo"].includes(path);

  const userName = user?.nome || "Mailson Cardoso";
  const userRole = user?.perfil || "Controller";
  const initials =
    userName
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "MC";

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-background">
          <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b bg-card/95 px-4 py-3 backdrop-blur md:px-8">
            <SidebarTrigger aria-label="Abrir ou recolher menu" className="shrink-0 text-muted-foreground" />
            <div className="ml-auto flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:flex-none">
              {showUnit && <UnitSelect value={f.unitId} onChange={f.setUnitId} className="h-9 sm:w-48" />}
              {showPeriod && <CompetenceSelect year={f.year} month={f.month} onYear={f.setYear} onMonth={f.setMonth} />}
              <div className="ml-1 flex items-center gap-1 sm:border-l sm:pl-3">
              <Notifications />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2" aria-label="Perfil do usuário">
                    <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{initials}</span>
                    <span className="hidden text-left text-sm leading-tight xl:block">
                      <span className="block font-medium">{userName}</span>
                      <span className="text-muted-foreground">{userRole}</span>
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email || "admin@apacmcb.org.br"}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/configuracoes">
                      <User className="mr-2 size-4" /> Perfil e preferências
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer font-medium"
                  >
                    <LogOut className="mr-2 size-4" /> Sair do sistema
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </div>
          </header>
          <div className="mx-auto w-full min-w-0 max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
