# FinanceControl - Backend Laravel 11

Backend REST API desenvolvido em Laravel 11 e PHP 8.3 para atender de forma compatível e desacoplada ao dashboard financeiro frontend do projeto `FinanceControl`.

## Requisitos do Ambiente
- **PHP**: `^8.2` (Ambiente: `8.3.15`)
- **Laravel Framework**: `^11.0` (Lock exato: `11.54.0`)
- **Composer**: `2.x`
- **Extensões PHP**: `pdo_sqlite` (ou `pdo_mysql` / `pdo_pgsql`), `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`.

---

## Estrutura do Backend

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── CashFlowController.php      # Endpoints de fluxo de caixa consolidado
│   │   │   ├── DashboardController.php     # Resumo financeiro, séries e comparativo mensal
│   │   │   ├── DbConnectionController.php  # CRUD de conexões e teste de conectividade
│   │   │   ├── ExpenseController.php       # Consulta e gestão de despesas
│   │   │   ├── IncomeController.php        # Consulta e gestão de receitas
│   │   │   ├── ReportController.php        # Relatórios comparativos e demonstrativo
│   │   │   └── UnitController.php          # CRUD de unidades organizacionais
│   │   └── Resources/
│   │       ├── DbConnectionResource.php    # Formatação JSON camelCase compatível
│   │       ├── ExpenseResource.php
│   │       ├── IncomeResource.php
│   │       └── UnitResource.php
│   ├── Models/
│   │   ├── DbConnection.php
│   │   ├── Expense.php
│   │   ├── Income.php
│   │   └── Unit.php
│   └── Services/
│       └── FinanceService.php              # Regras financeiras e cálculos oficiais
├── config/
│   └── cors.php                            # CORS liberado para integração com frontend Vite
├── database/
│   ├── migrations/                         # Tabelas: units, db_connections, incomes, expenses
│   └── seeders/
│       ├── DatabaseSeeder.php
│       ├── DbConnectionSeeder.php
│       ├── FinanceDataSeeder.php           # Dataset gerado alinhado ao mock do front
│       └── UnitSeeder.php
├── routes/
│   └── api.php                             # Rotas REST sob /api/*
└── tests/
    ├── Feature/
    │   └── FinanceApiTest.php              # Cobertura de todos os endpoints HTTP
    └── Unit/
        └── FinanceServiceTest.php          # Cobertura das regras idênticas a src/test/finance.test.ts
```

---

## Instalação e Execução

1. **Entrar na pasta backend**:
   ```bash
   cd backend
   ```

2. **Instalar dependências** (caso esteja configurando em novo clone):
   ```bash
   composer install
   ```

3. **Configurar o arquivo de ambiente** (se necessário):
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Executar migrações e popular dados simulados**:
   ```bash
   php artisan migrate --seed
   ```

5. **Iniciar o servidor de desenvolvimento**:
   ```bash
   php artisan serve
   ```
   A API estará acessível em: `http://localhost:8000/api`

---

## Rotas da API (`/api`)

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/units` | Lista todas as unidades organizacionais |
| `POST` | `/api/units` | Cadastro de unidade |
| `GET` | `/api/units/{id}` | Detalhes de uma unidade |
| `PUT` | `/api/units/{id}` | Edição de unidade |
| `DELETE` | `/api/units/{id}` | Exclusão de unidade |
| `GET` | `/api/connections` | Lista conexões configuradas (senha sempre mascarada) |
| `POST` | `/api/connections` | Cadastro de conexão |
| `GET` | `/api/connections/{id}` | Detalhes de uma conexão |
| `PUT` | `/api/connections/{id}` | Atualização de configuração de conexão |
| `DELETE` | `/api/connections/{id}` | Exclusão de configuração de conexão |
| `POST` | `/api/connections/{id}/test` | Teste de conectividade e atualização do `lastCheck` |
| `GET` | `/api/incomes` | Listagem com filtros (`unitId`, `year`, `month`, `from`, `to`, `cat`, `status`, `q`) |
| `GET` | `/api/expenses` | Listagem com filtros (`unitId`, `year`, `month`, `from`, `to`, `cat`, `status`, `q`) |
| `GET` | `/api/cash-flow` | Fluxo de caixa com saldo de abertura e saldo acumulado |
| `GET` | `/api/dashboard/summary` | Resumo financeiro consolidado, variação percentual e gráficos |
| `GET` | `/api/reports/compare` | Comparativo entre unidades com evolução anual |
| `GET` | `/api/reports/demonstrative` | Demonstrativo financeiro detalhado (recebidas vs pagas) |

---

## Regras de Negócio e Segurança

1. **Acesso Somente Leitura aos Bancos das Unidades**: As credenciais nunca são expostas em texto plano e as operações em bancos de dados de ERPs de origem são exclusivamente de leitura (`SELECT`).
2. **Cálculo de Saldo do Período**: O saldo do período considera exclusivamente receitas recebidas e despesas pagas:
   $$\text{Saldo} = \text{Receitas Recebidas} - \text{Despesas Pagas}$$
   Receitas pendentes e despesas não pagas (a vencer/vencidas) são contabilizadas em indicadores separados, sem impactar o saldo efetivo.
3. **Compatibilidade Direta com Frontend**: Os recursos retornam os atributos em formato camelCase (`unitId`, `lastCheck`, `passwordMask`, `dueDate`, `paymentDate`, `connectionId`), permitindo substituição imediata no `src/services/http.ts`.

---

## Testes Automatizados

Para executar os testes automatizados da API e das regras financeiras:
```bash
php artisan test
```
