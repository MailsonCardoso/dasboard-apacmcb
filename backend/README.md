# FinanceControl - Backend Laravel 11

Backend REST API desenvolvido em Laravel 11 e PHP 8.3 para atender de forma compatível e desacoplada ao dashboard financeiro frontend do projeto `FinanceControl` / `dasboard-apacmcb`.

## Requisitos do Ambiente
- **PHP**: `^8.2` (Ambiente: `8.3.15`)
- **Laravel Framework**: `^11.0` (Lock exato: `11.54.0`)
- **Composer**: `2.x`
- **Banco de Dados Central**: MySQL 5.7.44+ / 8.0+ (`hgm21923_dasboard_apacmcb`)
- **Extensões PHP**: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`.

---

## Banco de Dados Central MySQL

O banco de dados central (`hgm21923_dasboard_apacmcb`) conta com:
- **Compatibilidade MySQL 5.7 e 8.x**: Collation `utf8mb4_unicode_ci`, tamanho padrão de string em chaves `191` caracteres (`Schema::defaultStringLength(191)`).
- **Tabelas do Sistema**:
  - `usuarios`, `perfis`, `permissoes`, `perfil_permissao`, `usuario_unidade`, `preferencias_usuario` (RBAC completo)
  - `unidades`, `conexoes`, `verificacoes_conexao`, `sincronizacoes`
  - `categorias`, `lancamentos` (unificado para receitas e despesas), `saldos_abertura`
  - `auditoria` (registro de ações)
- **Views Otimizadas**:
  - `vw_receitas`: listagem de lançamentos do tipo receita
  - `vw_despesas`: listagem de despesas com status calculado dinamicamente (`paga`, `vencida`, `a vencer`)
  - `vw_fluxo_caixa`: consolidação de movimentações por competência e caixa
  - `vw_resumo_competencia` & `vw_resumo_caixa`: apurações financeiras mensais

---

## Estrutura do Backend

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php          # Autenticação via tokens Sanctum
│   │   │   ├── PreferenceController.php    # Preferências do usuário (dark mode, unidade padrão)
│   │   │   ├── CashFlowController.php      # Endpoints de fluxo de caixa consolidado
│   │   │   ├── DashboardController.php     # Resumo financeiro, séries e comparativo mensal
│   │   │   ├── DbConnectionController.php  # CRUD de conexões e teste de conectividade
│   │   │   ├── ExpenseController.php       # Consulta e gestão de despesas
│   │   │   ├── IncomeController.php        # Consulta e gestão de receitas
│   │   │   ├── ReportController.php        # Relatórios comparativos e demonstrativo
│   │   │   └── UnitController.php          # CRUD de unidades organizacionais
│   │   └── Resources/
│   │       ├── DbConnectionResource.php    # Formatação JSON camelCase compatível com React
│   │       ├── ExpenseResource.php
│   │       ├── IncomeResource.php
│   │       └── UnitResource.php
│   ├── Models/
│   │   ├── Unidade.php / Unit.php
│   │   ├── Conexao.php / DbConnection.php
│   │   ├── Lancamento.php / Expense.php / Income.php
│   │   ├── User.php / Perfil.php / Permissao.php
│   │   └── Categoria.php / SaldoAbertura.php / Auditoria.php
│   └── Services/
│       └── FinanceService.php              # Regras financeiras e cálculos oficiais
├── config/
│   └── cors.php                            # CORS liberado para integração com frontend Vite
├── database/
│   ├── migrations/                         # Tabelas RBAC, unidades, conexões, lançamentos e views
│   └── seeders/
│       ├── DatabaseSeeder.php
│       ├── RbacSeeder.php                  # Perfis, permissões e usuário administrador
│       ├── CategoriaSeeder.php             # Categorias padrão de receitas e despesas
│       ├── UnidadeSeeder.php               # 5 unidades oficiais APAC
│       ├── ConexaoSeeder.php               # Conexões criptografadas
│       └── LancamentoSeeder.php            # 1.610 lançamentos para 2025 e 2026
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

2. **Instalar dependências**:
   ```bash
   composer install
   ```

3. **Configurar o arquivo de ambiente**:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
   Configurar no `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=50.116.113.174
   DB_PORT=3306
   DB_DATABASE=hgm21923_dasboard_apacmcb
   DB_USERNAME=hgm21923_dasboard_apacmcb
   DB_PASSWORD=sua_senha_aqui
   DB_COLLATION=utf8mb4_unicode_ci
   ```

4. **Executar migrações e popular dados**:
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
| `POST` | `/api/auth/login` | Login com e-mail e senha, retorna token Sanctum |
| `POST` | `/api/auth/logout` | Revogação de token ativo |
| `GET` | `/api/auth/me` | Dados do usuário autenticado e permissões |
| `GET` | `/api/preferences` | Obter preferências do usuário |
| `PUT` | `/api/preferences` | Atualizar tema e unidade padrão |
| `GET` | `/api/units` | Lista todas as unidades organizacionais |
| `POST` | `/api/units` | Cadastro de unidade |
| `GET` | `/api/units/{id}` | Detalhes de uma unidade |
| `PUT` | `/api/units/{id}` | Edição de unidade |
| `DELETE` | `/api/units/{id}` | Exclusão/desativação de unidade |
| `GET` | `/api/connections` | Lista conexões configuradas (senha sempre mascarada) |
| `POST` | `/api/connections` | Cadastro de conexão |
| `GET` | `/api/connections/{id}` | Detalhes de uma conexão |
| `PUT` | `/api/connections/{id}` | Atualização de configuração de conexão |
| `DELETE` | `/api/connections/{id}` | Exclusão de configuração de conexão |
| `POST` | `/api/connections/{id}/test` | Teste de conectividade e histórico em `verificacoes_conexao` |
| `GET` | `/api/incomes` | Listagem com filtros (`unitId`, `year`, `month`, `from`, `to`, `cat`, `status`, `q`) |
| `GET` | `/api/expenses` | Listagem com filtros (`unitId`, `year`, `month`, `from`, `to`, `cat`, `status`, `q`) |
| `GET` | `/api/cash-flow` | Fluxo de caixa com saldo de abertura e saldo acumulado |
| `GET` | `/api/dashboard/summary` | Resumo financeiro consolidado, variação percentual e gráficos |
| `GET` | `/api/reports/compare` | Comparativo entre unidades com evolução anual |
| `GET` | `/api/reports/demonstrative` | Demonstrativo financeiro detalhado (recebidas vs pagas) |

---

## Usuário Padrão de Acesso

- **E-mail:** `admin@apacmcb.org.br`
- **Senha:** `Admin@2026!`
- **Perfil:** Administrador (acesso a todas as unidades)

---

## Testes Automatizados

Para executar a suíte de testes (16 testes, 936 asserções):
```bash
php artisan test
```
