# Project Structure

**Root:** `projeto-app-fullstack/`

## Directory Tree

```
projeto-app-fullstack/
├── .specs/                        # Documentação técnica (este projeto)
│   ├── codebase/                  # Brownfield analysis
│   └── project/                   # Visão, roadmap, estado
├── SDD.md                         # Design doc legado (substituído por .specs/)
│
├── expense-tracker-app/           # React Native / Expo
│   ├── src/
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx     # Lista de gastos + resumo financeiro
│   │   │   └── FormScreen.tsx     # Criar / editar gasto
│   │   ├── components/
│   │   │   └── ExpenseCard.tsx    # Card de item da lista
│   │   ├── services/
│   │   │   └── api.ts             # Axios client + expenseService (CRUD)
│   │   └── types/
│   │       ├── expense.ts         # Expense, Category, DTOs
│   │       └── navigation.ts      # RootStackParamList
│   ├── assets/                    # Ícones, splash
│   ├── app.json                   # Config Expo (bundle id, EAS project id)
│   ├── eas.json                   # Build profiles + env vars de build
│   ├── .env                       # EXPO_PUBLIC_API_URL (gitignored)
│   └── package.json
│
└── expense-tracker-api/           # Node.js / Express
    ├── src/
    │   ├── server.ts              # Entry point, CORS, middleware, app.listen
    │   ├── routes/
    │   │   └── expenseRoutes.ts   # 5 rotas REST para /api/expenses
    │   ├── controllers/
    │   │   └── expenseController.ts  # getAll, getById, create, update, remove
    │   ├── models/
    │   │   └── expense.ts         # Expense interface, Category type, DTOs
    │   └── config/
    │       └── supabase.ts        # createClient com service key
    ├── .env                       # PORT, SUPABASE_URL, SUPABASE_SERVICE_KEY (gitignored)
    └── package.json
```

## Module Organization

### App — Screens
**Purpose:** UI + lógica de interação do usuário
**Location:** `expense-tracker-app/src/screens/`
**Key files:** `HomeScreen.tsx` (lista, totais, delete), `FormScreen.tsx` (criar/editar)

### App — Services
**Purpose:** Toda comunicação com a API
**Location:** `expense-tracker-app/src/services/api.ts`
**Key files:** `api.ts` — único ponto de contato com o backend

### API — Controllers
**Purpose:** Handlers de request/response, validação, interação com Supabase
**Location:** `expense-tracker-api/src/controllers/`

### API — Config
**Purpose:** Inicialização de clientes externos
**Location:** `expense-tracker-api/src/config/supabase.ts`

## Where Things Live

**CRUD de gastos:**
- UI/Interface: `expense-tracker-app/src/screens/HomeScreen.tsx`, `FormScreen.tsx`
- HTTP Client: `expense-tracker-app/src/services/api.ts`
- API Handlers: `expense-tracker-api/src/controllers/expenseController.ts`
- Rotas: `expense-tracker-api/src/routes/expenseRoutes.ts`
- Banco: tabela `expenses` no Supabase

**Tipos compartilhados:**
- App: `expense-tracker-app/src/types/expense.ts`
- API: `expense-tracker-api/src/models/expense.ts`
- (duplicados manualmente — sem pacote shared)

**Configuração de ambiente:**
- API: `expense-tracker-api/.env`
- App build: `expense-tracker-app/eas.json` → `env`
- App dev local: `expense-tracker-app/.env`
