import type { DbConnection, Expense, Income, Unit } from "@/types";

/** Data de referência fixa dos dados simulados (evita divergência SSR/cliente). */
export const REFERENCE_DATE = "2026-11-09";

export const units: Unit[] = [
  { id: "u1", name: "Matriz", code: "MTZ-001", description: "Sede administrativa e financeira", active: true },
  { id: "u2", name: "Unidade São Luís", code: "SLZ-002", description: "Operação regional da capital", active: true },
  { id: "u3", name: "Unidade Imperatriz", code: "IMP-003", description: "Polo comercial sudoeste", active: true },
  { id: "u4", name: "Unidade Caxias", code: "CXS-004", description: "Filial leste", active: true },
  { id: "u5", name: "Unidade Balsas", code: "BAL-005", description: "Filial sul — agronegócio", active: false },
];

export const connections: DbConnection[] = [
  { id: "c1", name: "Banco Financeiro Matriz", unitId: "u1", type: "MySQL", host: "192.168.1.100", port: 3306, database: "financeiro_db", user: "consulta_financeira", passwordMask: "••••••••••", description: "Base principal do ERP da matriz", status: "online", lastCheck: "2026-11-09T18:42:00" },
  { id: "c2", name: "Contábil Matriz", unitId: "u1", type: "PostgreSQL", host: "10.0.0.15", port: 5432, database: "contabil", user: "ro_contabil", passwordMask: "••••••••", description: "Lançamentos contábeis consolidados", status: "online", lastCheck: "2026-11-09T18:40:00" },
  { id: "c3", name: "Financeiro São Luís", unitId: "u2", type: "MariaDB", host: "slz-db.interno.local", port: 3306, database: "fin_slz", user: "leitura_slz", passwordMask: "•••••••••", description: "ERP regional São Luís", status: "online", lastCheck: "2026-11-09T18:35:00" },
  { id: "c4", name: "Financeiro Imperatriz", unitId: "u3", type: "SQL Server", host: "192.168.20.8", port: 1433, database: "FinanceiroIMP", user: "svc_readonly", passwordMask: "•••••••••••", description: "Sistema legado Imperatriz", status: "instavel", lastCheck: "2026-11-09T17:58:00" },
  { id: "c5", name: "Financeiro Caxias", unitId: "u4", type: "MySQL", host: "192.168.30.12", port: 3306, database: "caxias_fin", user: "consulta", passwordMask: "••••••••", description: "ERP filial Caxias", status: "online", lastCheck: "2026-11-09T18:30:00" },
  { id: "c6", name: "Financeiro Balsas", unitId: "u5", type: "Oracle", host: "bal-ora.interno.local", port: 1521, database: "BALFIN", user: "RO_FIN", passwordMask: "••••••••••", description: "Base Oracle filial Balsas", status: "offline", lastCheck: "2026-11-08T22:10:00" },
];

const INCOME_CATS = ["Vendas de produtos", "Prestação de serviços", "Contratos recorrentes", "Rendimentos financeiros", "Outras receitas"];
const EXPENSE_CATS = ["Folha de pagamento", "Fornecedores", "Aluguel", "Energia e água", "Impostos", "Marketing", "Tecnologia", "Manutenção"];
const INCOME_DESC: Record<string, string[]> = {
  "Vendas de produtos": ["Venda balcão", "Pedido atacado", "Venda e-commerce"],
  "Prestação de serviços": ["Consultoria técnica", "Serviço de instalação", "Suporte mensal"],
  "Contratos recorrentes": ["Mensalidade contrato", "Assinatura corporativa"],
  "Rendimentos financeiros": ["Rendimento aplicação CDB", "Juros conta remunerada"],
  "Outras receitas": ["Reembolso de despesas", "Venda de ativo"],
};
const EXPENSE_DESC: Record<string, string[]> = {
  "Folha de pagamento": ["Salários do mês", "Encargos trabalhistas"],
  Fornecedores: ["Compra de mercadorias", "Insumos operacionais"],
  Aluguel: ["Aluguel do imóvel"],
  "Energia e água": ["Conta de energia", "Conta de água"],
  Impostos: ["DAS / Simples", "ISS municipal", "ICMS"],
  Marketing: ["Campanha digital", "Material gráfico"],
  Tecnologia: ["Licenças de software", "Link de internet"],
  Manutenção: ["Manutenção predial", "Manutenção de equipamentos"],
};

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const UNIT_SCALE: Record<string, number> = { u1: 1.8, u2: 1.2, u3: 1, u4: 0.75, u5: 0.6 };
const pad = (n: number) => String(n).padStart(2, "0");

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function generate() {
  const r = rng(20261109);
  const incomes: Income[] = [];
  const expenses: Expense[] = [];
  let ic = 1, ec = 1;
  for (const year of [2025, 2026]) {
    for (let month = 1; month <= 12; month++) {
      if (year === 2026 && month > 11) break;
      for (const u of units) {
        const conn = connections.find((c) => c.unitId === u.id)!;
        const scale = (UNIT_SCALE[u.id] ?? 1) * (1 + (year - 2025) * 0.08 + Math.sin(month / 2) * 0.06);
        const maxDay = year === 2026 && month === 11 ? 9 : 28;
        for (let k = 0; k < 6; k++) {
          const cat = INCOME_CATS[Math.floor(r() * INCOME_CATS.length)]!;
          const descs = INCOME_DESC[cat]!;
          const date = `${year}-${pad(month)}-${pad(1 + Math.floor(r() * maxDay))}`;
          const ageDays = (Date.parse(REFERENCE_DATE) - Date.parse(date)) / 864e5;
          incomes.push({
            id: `r${ic}`, code: `REC-${String(ic).padStart(5, "0")}`, date,
            description: descs[Math.floor(r() * descs.length)]!, category: cat, unitId: u.id,
            amount: Math.round((4000 + r() * 22000) * scale * 100) / 100,
            status: ageDays > 45 || r() > 0.4 ? "Recebida" : "Pendente",
            connectionId: conn.id,
          });
          ic++;
        }
        for (let k = 0; k < 8; k++) {
          const cat = EXPENSE_CATS[k % EXPENSE_CATS.length]!;
          const descs = EXPENSE_DESC[cat]!;
          const date = `${year}-${pad(month)}-${pad(1 + Math.floor(r() * maxDay))}`;
          const dueDate = addDays(date, 5 + Math.floor(r() * 20));
          const base = cat === "Folha de pagamento" ? 14000 : cat === "Fornecedores" ? 9000 : 2500;
          const paid = dueDate < "2026-10-01" || r() > 0.45;
          const paymentDate = paid ? (() => { const p = addDays(dueDate, -Math.floor(r() * 4)); return p > REFERENCE_DATE ? REFERENCE_DATE : p; })() : null;
          expenses.push({
            id: `d${ec}`, code: `DES-${String(ec).padStart(5, "0")}`, date, dueDate, paymentDate,
            description: descs[Math.floor(r() * descs.length)]!, category: cat, unitId: u.id,
            amount: Math.round(base * (0.7 + r() * 0.6) * scale * 100) / 100,
            status: paid ? "Paga" : dueDate < REFERENCE_DATE ? "Vencida" : "Pendente",
            connectionId: conn.id,
          });
          ec++;
        }
      }
    }
  }
  return { incomes, expenses };
}

const generated = generate();
export const incomes = generated.incomes;
export const expenses = generated.expenses;
