# Auth Design

**Spec:** `.specs/features/auth/spec.md`
**Context:** `.specs/features/auth/context.md`
**Status:** Draft

---

## Architecture Overview

Dois stacks de navegação separados. App decide qual mostrar baseado no estado de sessão do Supabase.

```
App boot
    │
    ▼
AuthProvider (contexto global)
    │
    ├─ sessão válida ──► AppStack (Tab/HomeScreen)
    │
    └─ sem sessão ────► AuthStack (Login / Signup)

AuthStack                    AppStack
┌─────────────┐              ┌─────────────┐
│ LoginScreen │              │ HomeScreen  │
│ SignupScreen│              │ FormScreen  │
└─────────────┘              └─────────────┘

App ──HTTP──► Express API
              │  middleware: verifyJWT
              │  extrai user_id do token
              ▼
           Supabase (RLS + user_id filter)
```

**Fluxo de sessão:**
1. App abre → `supabase.auth.getSession()` → decide stack
2. Login/signup → Supabase retorna `{ session: { access_token } }`
3. Token salvo automaticamente pelo Supabase JS SDK (AsyncStorage)
4. Cada request axios injeta `Authorization: Bearer <token>` via interceptor
5. API extrai `user_id` do JWT, usa em todas as queries Supabase

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
| --- | --- | --- |
| `expenseService` (axios instance) | `src/services/api.ts` | Adicionar interceptor de auth nesse mesmo arquivo |
| `StyleSheet` dark theme | `HomeScreen.tsx` | Copiar paleta de cores (#0D0D0D, #1A1A1A, #00D4A1) |
| `Alert.alert` error pattern | `HomeScreen.tsx` | Mesmo padrão para erros de auth |
| Express middleware pattern | `server.ts` | `app.use(verifyJWT)` antes das rotas de expenses |

### Integration Points

| System | Integration Method |
| --- | --- |
| Supabase Auth | `@supabase/supabase-js` já instalado na API — usar `supabase.auth.getUser(token)` |
| React Navigation | Novo `AuthStack` + `AppStack` dentro de `RootNavigator` condicional |
| Axios | Interceptor `request` que injeta header `Authorization` |

---

## Components

### AuthProvider

- **Purpose:** Contexto React global — expõe `session`, `user`, `signOut()`. Observa mudanças de sessão via `supabase.auth.onAuthStateChange`.
- **Location:** `expense-tracker-app/src/contexts/AuthContext.tsx`
- **Interfaces:**
  - `useAuth(): { session, user, signOut, loading }`
- **Dependencies:** `@supabase/supabase-js` client no app
- **Reuses:** padrão de contexto React padrão

### Supabase Client (App)

- **Purpose:** Instância do Supabase JS no app — só para Auth (não para queries de dados).
- **Location:** `expense-tracker-app/src/lib/supabase.ts`
- **Interfaces:**
  - `supabase.auth.signInWithPassword({ email, password })`
  - `supabase.auth.signUp({ email, password })`
  - `supabase.auth.signOut()`
  - `supabase.auth.getSession()`
  - `supabase.auth.onAuthStateChange(callback)`
- **Dependencies:** `@supabase/supabase-js`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **Nota:** Usa `anon key` (pública) — NÃO a service key

### RootNavigator

- **Purpose:** Decide qual stack renderizar baseado em `session` do AuthContext.
- **Location:** `expense-tracker-app/src/navigation/RootNavigator.tsx`
- **Interfaces:** sem props — lê do `useAuth()`
- **Reuses:** stacks de navegação existentes do `App.tsx`

### LoginScreen

- **Purpose:** Formulário de login (e-mail + senha) + link para signup.
- **Location:** `expense-tracker-app/src/screens/LoginScreen.tsx`
- **Interfaces:** `NativeStackScreenProps<AuthStackParamList, 'Login'>`
- **Reuses:** paleta dark theme, padrão `Alert.alert` para erros

### SignupScreen

- **Purpose:** Formulário de cadastro (e-mail + senha + confirmar senha) + estado de "verifique seu inbox".
- **Location:** `expense-tracker-app/src/screens/SignupScreen.tsx`
- **Interfaces:** `NativeStackScreenProps<AuthStackParamList, 'Signup'>`
- **Reuses:** mesmos componentes visuais do LoginScreen

### Axios Auth Interceptor

- **Purpose:** Injeta `Authorization: Bearer <token>` em todo request automaticamente.
- **Location:** `expense-tracker-app/src/services/api.ts` (estender arquivo existente)
- **Interfaces:** `setupAuthInterceptor(getToken: () => string | null): void`
- **Reuses:** instância axios existente

### verifyJWT (API middleware)

- **Purpose:** Valida JWT de cada request, extrai `user_id`, injeta em `req.user`.
- **Location:** `expense-tracker-api/src/middleware/verifyJWT.ts`
- **Interfaces:** `verifyJWT(req, res, next): void`
- **Dependencies:** `supabase.auth.getUser(token)` — valida token via Supabase

### expenseController (update)

- **Purpose:** Todas as queries passam a filtrar por `req.user.id`.
- **Location:** `expense-tracker-api/src/controllers/expenseController.ts` (modificar existente)
- **Mudanças:** `getAll` adiciona `.eq('user_id', userId)`, `create` injeta `user_id`, `getById`/`update`/`delete` adicionam `.eq('user_id', userId)`

---

## Data Models

### Supabase — Migration SQL

```sql
-- 1. Limpar dados sem user_id (decisão: descartar)
TRUNCATE TABLE expenses;

-- 2. Adicionar coluna user_id
ALTER TABLE expenses
  ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Habilitar RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 4. Policy: usuário só acessa seus dados
CREATE POLICY "user_expenses_only"
  ON expenses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

> **Nota:** RLS é backup de segurança. A API já filtra por `user_id` via middleware. Dupla proteção.

### Tipos novos (App)

```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// src/types/navigation.ts — adicionar
type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};
```

### Variáveis de ambiente novas

```
# App (.env + eas.json)
EXPO_PUBLIC_SUPABASE_URL=https://sytulbxmbiqkypseafxe.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key do dashboard Supabase>

# API (.env) — já existe, sem mudança
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
```

---

## Error Handling Strategy

| Error Scenario | Handling | User Sees |
| --- | --- | --- |
| Credenciais inválidas | Capturar erro Supabase `invalid_credentials` | "E-mail ou senha incorretos" |
| E-mail não confirmado | Capturar `email_not_confirmed` | "Confirme seu e-mail antes de entrar" |
| E-mail já cadastrado | Capturar `user_already_exists` | "E-mail já está em uso" |
| Token expirado | Supabase SDK faz refresh automático; se falhar → `onAuthStateChange` emite `SIGNED_OUT` | Redireciona para Login automaticamente |
| Request sem token | API retorna 401 | App intercepta 401, chama `signOut()`, redireciona |
| Erro de rede no login | Axios network error | "Erro de conexão. Verifique sua internet." |

---

## Tech Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Sessão no app | Supabase JS SDK com AsyncStorage | SDK gerencia refresh automático de token — zero código extra |
| Validação de token na API | `supabase.auth.getUser(token)` | Mais seguro que decodificar JWT manualmente — Supabase valida assinatura e expiração |
| `anon key` no app vs `service key` | `anon key` | Service key é admin — nunca no cliente mobile |
| RLS + filtro na API | Dupla proteção | RLS como safety net caso o middleware falhe |
| Auth state | React Context | Simples, sem Redux/Zustand — app pequeno |
