# Auth Tasks

**Design:** `.specs/features/auth/design.md`
**Status:** Approved

---

## Execution Plan

```
Phase 1 — Foundation (tudo em paralelo, sem dependências):
  T1 [P]  T2 [P]  T4 [P]  T6 [P]

Phase 2 — Após Phase 1 (paralelo entre si):
  T1+T2 → T3 [P]
  T4    → T5 [P]

Phase 3 — Após Phase 2 (paralelo entre si):
  T5+T6 → T7 [P]
  T5+T6 → T8 [P]
  T5    → T10 [P]
  T2    → T11 [P]

Phase 4 — Após Phase 3:
  T7+T8+T5+T6 → T9
  T9+T5       → T12
```

---

## Task Breakdown

### T1: Migration SQL — user_id + RLS [P]

**What:** Executar migration no Supabase: truncate dados, adicionar `user_id`, habilitar RLS, criar policy
**Where:** Supabase dashboard SQL editor (não é arquivo de código — é SQL executado manualmente)
**Depends on:** None
**Requirement:** AUTH-10, AUTH-11

**Done when:**
- [ ] `expenses` table truncada (dados antigos removidos)
- [ ] Coluna `user_id UUID NOT NULL REFERENCES auth.users(id)` existe
- [ ] RLS habilitado na tabela (`ALTER TABLE expenses ENABLE ROW LEVEL SECURITY`)
- [ ] Policy `user_expenses_only` criada com `USING (auth.uid() = user_id)`
- [ ] Verificar no Supabase: INSERT sem user_id válido retorna erro

**SQL a executar:**
```sql
TRUNCATE TABLE expenses;

ALTER TABLE expenses
  ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_expenses_only"
  ON expenses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Tests:** none (sem framework)
**Gate:** manual — checar no Supabase Table Editor

---

### T2: verifyJWT middleware (API) [P]

**What:** Criar middleware Express que valida JWT via Supabase, injeta `req.user.id`
**Where:** `expense-tracker-api/src/middleware/verifyJWT.ts` (novo arquivo)
**Depends on:** None
**Requirement:** AUTH-12

**Done when:**
- [ ] Arquivo `verifyJWT.ts` criado
- [ ] Extrai token do header `Authorization: Bearer <token>`
- [ ] Chama `supabase.auth.getUser(token)` para validar
- [ ] Se inválido/ausente → retorna `res.status(401).json({ error: 'Unauthorized' })`
- [ ] Se válido → define `req.user = { id: user.id }` e chama `next()`
- [ ] TypeScript: extender `Request` com `user?: { id: string }`

**Tests:** none
**Gate:** manual — testar com curl sem token → esperar 401

---

### T4: Supabase client + env vars (App) [P]

**What:** Criar instância Supabase no app com anon key + adicionar vars ao .env e eas.json
**Where:** `expense-tracker-app/src/lib/supabase.ts` (novo), `.env`, `eas.json`
**Depends on:** None
**Requirement:** AUTH-04, AUTH-07

**Done when:**
- [ ] `src/lib/supabase.ts` criado com `createClient(url, anonKey)`
- [ ] `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` em `.env`
- [ ] Mesmas vars adicionadas em `eas.json` → `build.preview.env` e `build.production.env`
- [ ] `@supabase/supabase-js` instalado: `npm install @supabase/supabase-js`
- [ ] AsyncStorage instalado: `npx expo install @react-native-async-storage/async-storage`
- [ ] TypeScript compila sem erro

**Tests:** none
**Gate:** `npx tsc --noEmit`

---

### T6: Tipos de navegação AuthStack [P]

**What:** Adicionar `AuthStackParamList` e `AuthStack` navigator ao sistema de navegação
**Where:** `expense-tracker-app/src/types/navigation.ts` (modificar)
**Depends on:** None
**Requirement:** AUTH-01, AUTH-04

**Done when:**
- [ ] `AuthStackParamList = { Login: undefined; Signup: undefined }` exportado
- [ ] `RootStackParamList` renomeado para `AppStackParamList` (ou mantido, conforme existente)
- [ ] TypeScript compila sem erro

**Tests:** none
**Gate:** `npx tsc --noEmit`

---

### T3: expenseController — filtrar por user_id

**What:** Atualizar todos os métodos do controller para usar `req.user.id` em todas as queries
**Where:** `expense-tracker-api/src/controllers/expenseController.ts` (modificar)
**Depends on:** T1 (coluna user_id existe), T2 (req.user disponível)
**Requirement:** AUTH-10, AUTH-11

**Done when:**
- [ ] `getAll`: adiciona `.eq('user_id', userId)` na query
- [ ] `getById`: adiciona `.eq('user_id', userId)` — retorna 404 se não é do user
- [ ] `create`: injeta `user_id: userId` no body antes do insert (nunca aceita do cliente)
- [ ] `update`: adiciona `.eq('user_id', userId)` — não atualiza gasto de outro user
- [ ] `remove`: adiciona `.eq('user_id', userId)` — não remove gasto de outro user
- [ ] TypeScript compila sem erro

**Tests:** none
**Gate:** manual — após T11, testar com token válido

---

### T5: AuthContext + useAuth hook

**What:** Criar contexto React com estado de sessão, funções de auth e observer de mudanças
**Where:** `expense-tracker-app/src/contexts/AuthContext.tsx` (novo arquivo)
**Depends on:** T4 (supabase client disponível)
**Requirement:** AUTH-07, AUTH-08, AUTH-09

**Done when:**
- [ ] `AuthProvider` criado com `supabase.auth.onAuthStateChange` para observar sessão
- [ ] `useAuth()` exporta `{ session, user, loading, signOut }`
- [ ] `loading: true` enquanto `getSession()` inicial resolve
- [ ] `signOut()` chama `supabase.auth.signOut()`
- [ ] TypeScript compila sem erro

**Tests:** none
**Gate:** `npx tsc --noEmit`

---

### T7: LoginScreen [P]

**What:** Tela de login com campos e-mail + senha, validação client-side e tratamento de erros
**Where:** `expense-tracker-app/src/screens/LoginScreen.tsx` (novo arquivo)
**Depends on:** T5 (useAuth), T6 (tipos de nav)
**Requirement:** AUTH-04, AUTH-05, AUTH-06

**Done when:**
- [ ] Campos `email` e `password` com estado local
- [ ] Botão "Entrar" chama `supabase.auth.signInWithPassword({ email, password })`
- [ ] Validação: campos em branco bloqueiam submit
- [ ] Erro `invalid_credentials` → `Alert` "E-mail ou senha incorretos"
- [ ] Erro `email_not_confirmed` → `Alert` "Confirme seu e-mail antes de entrar"
- [ ] Loading state no botão durante request
- [ ] Link "Criar conta" navega para SignupScreen
- [ ] Dark theme consistente com resto do app (#0D0D0D, #00D4A1)
- [ ] TypeScript compila sem erro

**Tests:** none
**Gate:** `npx tsc --noEmit`

---

### T8: SignupScreen [P]

**What:** Tela de cadastro com e-mail + senha + confirmar senha, e estado pós-signup
**Where:** `expense-tracker-app/src/screens/SignupScreen.tsx` (novo arquivo)
**Depends on:** T5 (useAuth), T6 (tipos de nav)
**Requirement:** AUTH-01, AUTH-02, AUTH-03

**Done when:**
- [ ] Campos `email`, `password`, `confirmPassword` com estado local
- [ ] Validação: senha < 6 chars → erro; senhas não coincidem → erro; e-mail inválido → erro
- [ ] Botão "Criar conta" chama `supabase.auth.signUp({ email, password })`
- [ ] Após signup bem-sucedido: exibe mensagem "Verifique seu e-mail para confirmar a conta" (sem navegar)
- [ ] Erro `user_already_exists` → "E-mail já está em uso"
- [ ] Loading state no botão durante request
- [ ] Link "Já tenho conta" navega para LoginScreen
- [ ] Dark theme consistente
- [ ] TypeScript compila sem erro

**Tests:** none
**Gate:** `npx tsc --noEmit`

---

### T10: Axios interceptor de auth [P]

**What:** Adicionar interceptor no axios client que injeta `Authorization: Bearer <token>` em todo request
**Where:** `expense-tracker-app/src/services/api.ts` (modificar arquivo existente)
**Depends on:** T5 (AuthContext / supabase session disponível)
**Requirement:** AUTH-04 (token em todos os requests)

**Done when:**
- [ ] Interceptor `request` adicionado na instância axios
- [ ] Busca token via `supabase.auth.getSession()` antes de cada request
- [ ] Se token existe → adiciona `Authorization: Bearer <token>` no header
- [ ] Se não existe → deixa request seguir (API retornará 401)
- [ ] Interceptor `response` captura 401 global → chama `supabase.auth.signOut()` para limpar sessão
- [ ] TypeScript compila sem erro

**Tests:** none
**Gate:** `npx tsc --noEmit`

---

### T11: Registrar verifyJWT na API [P]

**What:** Adicionar middleware verifyJWT nas rotas de expenses no server.ts
**Where:** `expense-tracker-api/src/server.ts` (modificar)
**Depends on:** T2 (middleware criado)
**Requirement:** AUTH-12

**Done when:**
- [ ] `import verifyJWT` adicionado
- [ ] `app.use('/api/expenses', verifyJWT, expenseRoutes)` — middleware antes das rotas
- [ ] Rota `/health` NÃO protegida (sem verifyJWT)
- [ ] TypeScript compila sem erro

**Tests:** none
**Gate:** `npx tsc --noEmit` (API)

---

### T9: RootNavigator — stacks condicionais

**What:** Substituir navegação atual por RootNavigator que decide entre AuthStack e AppStack via sessão
**Where:** `expense-tracker-app/App.tsx` + `expense-tracker-app/src/navigation/RootNavigator.tsx` (novo)
**Depends on:** T5 (AuthContext), T6 (tipos), T7 (LoginScreen), T8 (SignupScreen)
**Requirement:** AUTH-07, AUTH-08

**Done when:**
- [ ] `RootNavigator.tsx` criado: se `loading` → ActivityIndicator; se `session` → AppStack; senão → AuthStack
- [ ] `AuthStack` inclui `LoginScreen` e `SignupScreen`
- [ ] `AppStack` mantém `HomeScreen` e `FormScreen` existentes
- [ ] `App.tsx` envolto em `AuthProvider` + usa `RootNavigator`
- [ ] Navegação entre Login ↔ Signup funciona
- [ ] Login bem-sucedido navega automaticamente para HomeScreen (via `onAuthStateChange`)
- [ ] TypeScript compila sem erro

**Tests:** none
**Gate:** `npx tsc --noEmit`

---

### T12: Botão de logout na HomeScreen

**What:** Adicionar botão "Sair" no header da HomeScreen
**Where:** `expense-tracker-app/src/screens/HomeScreen.tsx` (modificar)
**Depends on:** T5 (useAuth), T9 (navegação configurada)
**Requirement:** AUTH-09

**Done when:**
- [ ] Botão "Sair" no header direito via `navigation.setOptions`
- [ ] Toca botão → chama `signOut()` do `useAuth()`
- [ ] Após logout → `onAuthStateChange` redireciona para AuthStack automaticamente
- [ ] Nenhuma tela do AppStack acessível após logout
- [ ] TypeScript compila sem erro

**Tests:** none
**Gate:** `npx tsc --noEmit`

---

## Validações Pré-Aprovação

### Check 1: Granularidade

| Task | Escopo | Status |
| --- | --- | --- |
| T1: Migration SQL | 1 operação DB | ✅ |
| T2: verifyJWT middleware | 1 arquivo/função | ✅ |
| T3: Controller update | 1 arquivo, 5 métodos relacionados | ✅ |
| T4: Supabase client + env | 1 arquivo + config | ✅ |
| T5: AuthContext | 1 arquivo/contexto | ✅ |
| T6: Tipos de navegação | 1 arquivo de tipos | ✅ |
| T7: LoginScreen | 1 tela | ✅ |
| T8: SignupScreen | 1 tela | ✅ |
| T9: RootNavigator | 1 arquivo nav + App.tsx | ✅ |
| T10: Axios interceptor | 1 modificação em arquivo existente | ✅ |
| T11: Registrar middleware | 1 linha em server.ts | ✅ |
| T12: Logout no header | 1 modificação em HomeScreen | ✅ |

### Check 2: Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagrama mostra | Status |
| --- | --- | --- | --- |
| T1 | None | Phase 1 sem seta entrante | ✅ |
| T2 | None | Phase 1 sem seta entrante | ✅ |
| T4 | None | Phase 1 sem seta entrante | ✅ |
| T6 | None | Phase 1 sem seta entrante | ✅ |
| T3 | T1, T2 | T1+T2 → T3 | ✅ |
| T5 | T4 | T4 → T5 | ✅ |
| T7 | T5, T6 | T5+T6 → T7 | ✅ |
| T8 | T5, T6 | T5+T6 → T8 | ✅ |
| T10 | T5 | T5 → T10 | ✅ |
| T11 | T2 | T2 → T11 | ✅ |
| T9 | T7, T8, T5, T6 | T7+T8 → T9 | ✅ |
| T12 | T5, T9 | T9+T5 → T12 | ✅ |

### Check 3: Test Co-location

Sem framework de testes instalado (TESTING.md — 0% cobertura). Todos os layers têm cobertura "none". Sem violações.

| Task | Layer | Matrix | Task diz | Status |
| --- | --- | --- | --- | --- |
| Todos | qualquer | none | none | ✅ |

---

## Parallel Execution Map

```
Phase 1 (todos em paralelo):
  T1 [P] ─────────────────┐
  T2 [P] ──────────────┐  │
  T4 [P] ────────────┐ │  │
  T6 [P] ──────────┐ │ │  │
                   │ │ │  │
Phase 2:           ▼ ▼ ▼  ▼
  T5 (← T4)   [P] ──┐    │
  T3 (← T1,T2) ─────┼────┘

Phase 3 (paralelo entre si):
  T7  (← T5,T6) [P] ──┐
  T8  (← T5,T6) [P] ──┤
  T10 (← T5)    [P] ──┤
  T11 (← T2)    [P] ──┘

Phase 4 (sequencial):
  T9  (← T7,T8,T5,T6) → T12 (← T9,T5)
```

---

## Requirement Traceability

| Req ID | Task | Status |
| --- | --- | --- |
| AUTH-01 | T8 | Pending |
| AUTH-02 | T8 | Pending |
| AUTH-03 | T8 | Pending |
| AUTH-04 | T7, T10 | Pending |
| AUTH-05 | T7 | Pending |
| AUTH-06 | T7 | Pending |
| AUTH-07 | T5, T9 | Pending |
| AUTH-08 | T5, T9 | Pending |
| AUTH-09 | T12 | Pending |
| AUTH-10 | T1, T3 | Pending |
| AUTH-11 | T3 | Pending |
| AUTH-12 | T2, T11 | Pending |
