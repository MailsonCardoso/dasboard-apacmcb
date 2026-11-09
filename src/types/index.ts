export type DbType = "MySQL" | "MariaDB" | "PostgreSQL" | "SQL Server" | "Oracle";
export type ConnectionStatus = "online" | "offline" | "instavel";

export interface DbConnection {
  id: string;
  name: string;
  unitId: string;
  type: DbType;
  host: string;
  port: number;
  database: string;
  user: string;
  /** Apenas mascarado no frontend. A senha real fica no backend Laravel. */
  passwordMask: string;
  description: string;
  status: ConnectionStatus;
  lastCheck: string; // ISO
}

export interface Unit {
  id: string;
  name: string;
  code: string;
  description: string;
  active: boolean;
}

export type IncomeStatus = "Recebida" | "Pendente";
export type ExpenseStatus = "Paga" | "Pendente" | "Vencida";

export interface Income {
  id: string;
  code: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  unitId: string;
  amount: number;
  status: IncomeStatus;
  connectionId: string;
}

export interface Expense {
  id: string;
  code: string;
  date: string;
  dueDate: string;
  paymentDate: string | null;
  description: string;
  category: string;
  unitId: string;
  amount: number;
  status: ExpenseStatus;
  connectionId: string;
}

export interface CashMovement {
  id: string;
  date: string;
  code: string;
  description: string;
  unitId: string;
  category: string;
  type: "Entrada" | "Saída";
  inflow: number;
  outflow: number;
  balanceAfter: number;
  connectionId: string;
}

export interface PeriodFilter {
  unitId: string; // "all" ou id da unidade
  year: number;
  month: number; // 0 = ano inteiro, 1..12
}
