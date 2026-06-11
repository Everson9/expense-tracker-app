# Architecture

**Pattern:** Fullstack separado — API REST + app mobile desacoplados

## High-Level Structure

```
[React Native App] ──HTTP──► [Express API] ──Supabase SDK──► [PostgreSQL]
   (EAS Build)                 (Render.com)                   (Supabase)
```

App nunca acessa Supabase diretamente — toda comunicação passa pela API. Service key do Supabase fica só no servidor.

## Identified Patterns

### Service Layer (App)

**Location:** `expense-tracker-app/src/services/api.ts`
**Purpose:** Centraliza todos os calls HTTP, expõe `expenseService` com métodos CRUD
**Implementation:** Axios instance com `baseURL` + `timeout: 10000`, funções async que retornam tipos tipados
**Example:** `expenseService.getAll()` → `GET /api/expenses`

### Controller Pattern (API)

**Location:** `expense-tracker-api/src/controllers/expenseController.ts`
**Purpose:** Handlers Express separados por operação CRUD
**Implementation:** Funções async exportadas individualmente, sem classe. Validação inline no `create`.
**Example:** `export const getAll = async (_req, res) => { ... }`

### DTO Pattern

**Location:** `expense-tracker-api/src/models/expense.ts` (e espelhado em `expense-tracker-app/src/types/expense.ts`)
**Purpose:** Tipos compartilhados entre camadas sem pacote shared
**Implementation:** `CreateExpenseDTO = Omit<Expense, 'id' | 'created_at'>`, `UpdateExpenseDTO = Partial<CreateExpenseDTO>`
**Risco:** Duplicação manual — se mudar um lado, o outro pode ficar dessincronizado

## Data Flow

### Criar gasto

```
FormScreen → expenseService.create(dto)
           → POST /api/expenses
           → expenseController.create()
           → validação manual (title, amount, category, date)
           → supabase.from('expenses').insert([body]).select().single()
           → retorna Expense criado (201)
           → app atualiza estado local via navigation.goBack()
```

### Listar gastos

```
HomeScreen (useFocusEffect) → expenseService.getAll()
                            → GET /api/expenses
                            → supabase.from('expenses').select('*').order('date', desc)
                            → retorna Expense[]
                            → setExpenses(data)
```

## Code Organization

**Approach:** Layer-based (screens / components / services / types)

**App structure:**
```
src/
  screens/    # UI + lógica de tela (HomeScreen, FormScreen)
  components/ # UI reutilizável (ExpenseCard)
  services/   # HTTP client (api.ts)
  types/      # Interfaces TypeScript
```

**API structure:**
```
src/
  server.ts       # Entry point
  routes/         # Definição de rotas Express
  controllers/    # Handlers de request/response
  models/         # Types e DTOs
  config/         # Supabase client
```
