# Concerns

## 🔴 Crítico

### C-01: API sem autenticação

**Evidência:** `expense-tracker-api/src/server.ts` — sem middleware de auth. Nenhum JWT, API key, ou session.
**Risco:** Qualquer pessoa com a URL pode criar, editar ou deletar todos os gastos de qualquer usuário.
**Impacto:** Total — todos os dados expostos.
**Fix:** Implementar Supabase Auth + middleware de JWT no Express antes de qualquer usuário real usar o app.

### C-02: Service key do Supabase com acesso admin

**Evidência:** `supabase.ts` usa `SUPABASE_SERVICE_KEY` (service role), que bypassa RLS completamente.
**Risco:** Se a chave vazar, atacante tem acesso total ao banco.
**Fix:** Após implementar auth (C-01), trocar para `anon key` + RLS policies por usuário. Revogar a service key ou mover para operações admin-only.

---

## 🟡 Alto

### C-03: Zero testes

**Evidência:** Sem frameworks de teste instalados em nenhum dos dois pacotes. Sem scripts de test em `package.json`.
**Risco:** Qualquer mudança pode quebrar CRUD silenciosamente. Sem safety net para refactors futuros.
**Fix:** Instalar Jest + Supertest para API (integration tests). Implementar testes de `expenseController` contra Supabase de staging.

### C-04: Tipos duplicados entre app e API

**Evidência:** `expense-tracker-app/src/types/expense.ts` e `expense-tracker-api/src/models/expense.ts` são idênticos.
**Risco:** Drift silencioso — se adicionar campo na API (ex: `tags`), o tipo do app não atualiza automaticamente.
**Fix:** Criar pacote `shared/` na raiz com tipos compartilhados, importado por ambos. Ou gerar tipos do Supabase via `supabase gen types typescript`.

### C-05: Render free tier — cold start

**Evidência:** `eas.json` / documentação Render — free instances dormem após 15min de inatividade.
**Risco:** Primeiro request após inatividade demora 30-60s — UX ruim. App mostra "Erro" se timeout (axios `timeout: 10000` = 10s < cold start).
**Fix curto prazo:** Aumentar `timeout` do axios para 30s. Adicionar loading state mais descritivo.
**Fix longo prazo:** Upgrade para Render paid tier ou migrar para outro provider sem sleep.

---

## 🟠 Médio

### C-06: Sem tratamento de erro granular no app

**Evidência:** `HomeScreen.tsx:30-31` — `catch { Alert.alert('Erro', 'Não foi possível carregar os gastos.') }` — bloco catch sem parâmetro de erro.
**Risco:** Erros de rede, 401, 500 e timeout recebem a mesma mensagem genérica. Impossível debugar em produção.
**Fix:** Tipar o erro do axios (`AxiosError`), distinguir network error de server error, logar em serviço de erro (ex: Sentry).

### C-07: Sem validação no FormScreen (app)

**Evidência:** Validação só existe no controller da API (`expenseController.ts:41-44`). App pode enviar campos vazios.
**Risco:** UX ruim — erro retorna como Alert genérico ao invés de highlight no campo inválido.
**Fix:** Adicionar validação no `FormScreen` antes do submit (campos required, amount > 0, date válido).

### C-08: Sem linting ou formatação padronizada

**Evidência:** Sem ESLint, Prettier, ou Biome configurados em nenhum dos pacotes.
**Risco:** Estilo inconsistente conforme projeto cresce. PRs com diff de formatação.
**Fix:** Instalar ESLint + Prettier com config base do Expo para o app, eslint-config-node para a API.

---

## 🔵 Baixo

### C-09: Cores e tokens de design hardcoded

**Evidência:** `HomeScreen.tsx`, `ExpenseCard.tsx` — valores como `#0D0D0D`, `#00D4A1`, `#1A1A1A` repetidos inline.
**Risco:** Inconsistência visual ao escalar. Mudança de tema requer busca/replace em múltiplos arquivos.
**Fix:** Criar `src/theme/colors.ts` com constantes exportadas.

### C-10: Sem paginação na listagem

**Evidência:** `expenseController.ts:7-8` — `select('*')` sem limite. `HomeScreen` renderiza tudo de uma vez.
**Risco:** Performance degradada com volume alto de gastos.
**Fix:** Adicionar paginação cursor-based no Supabase (`.range(0, 49)`) e FlatList com `onEndReached`.
