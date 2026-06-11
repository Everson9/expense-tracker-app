# Roadmap

## Princípio de Design (imutável)

> **Registrar um gasto em ≤ 3 taps, sem confirmações desnecessárias.**
> Toda feature nova passa por esse filtro antes de entrar no roadmap.

---

## v1.0 — MVP ✅ (concluído)

- [x] CRUD de gastos (título, valor, categoria, data, descrição)
- [x] Resumo mensal + total geral
- [x] Dark theme
- [x] Pull-to-refresh
- [x] API REST no Render
- [x] APK via EAS Build

---

## v1.1 — Auth & Segurança ✅ (concluído)

**Objetivo:** Dados privados por usuário antes de qualquer uso real.

- [x] Signup com e-mail + senha
- [x] Login com sessão persistente (AsyncStorage)
- [x] Logout
- [x] Middleware JWT na API (401 sem token)
- [x] RLS no Supabase — cada usuário vê só seus gastos
- [x] Coluna `user_id` na tabela `expenses`
- [x] Axios interceptor injeta Bearer token em todas as requests

---

## v1.2 — Navegação Temporal & Visão Mensal ✅ (concluído)

**Objetivo:** Responder "quanto gastei esse mês?" em 1 toque.

- [x] Seletor de mês na HomeScreen (← mês →)
- [x] Filtrar gastos pelo mês selecionado
- [x] Total do mês sempre visível no header
- [x] MonthContext compartilhado entre todas as abas

---

## v1.3 — Receitas & Saldo Real ✅ (concluído)

**Objetivo:** Mostrar se o mês fechou no azul ou no vermelho.

- [x] Tipo de transação: `despesa` | `receita`
- [x] Saldo mensal = receitas - despesas (destaque no card de resumo)
- [x] Cor do saldo: verde (positivo) / vermelho (negativo)
- [x] Aba dedicada para Receitas com FAB pré-preenchido

---

## v1.4 — Gastos Recorrentes ✅ (concluído)

**Objetivo:** Aluguel, Netflix, academia — registrar uma vez, aparecer todo mês.

- [x] Flag `recorrente: boolean` no gasto
- [x] Toggle "repetir todo mês" no FormScreen
- [x] Badge visual em gastos recorrentes

---

## v1.5 — Parcelamento ✅ (concluído)

**Objetivo:** Compra parcelada distribui o valor nos meses seguintes automaticamente.

- [x] Campo "parcelar em X vezes" no FormScreen
- [x] Gera N entradas automaticamente (ex: 12x R$100 → 12 meses)
- [x] Badge "3/12" em cada parcela

---

## v1.6 — Orçamento por Categoria ✅ (concluído)

**Objetivo:** Limite mensal por categoria + alerta visual quando estiver próximo.

- [x] Definir limite mensal por categoria (modal na HomeScreen)
- [x] Barra de progresso por categoria na HomeScreen
- [x] Alerta visual quando > 80% do limite
- [x] Badge vermelho quando limite ultrapassado

---

## v1.7 — Tab Navigation + Profile + Custom Categories ✅ (concluído)

**Objetivo:** Navegação por abas, perfil do usuário e categorias customizáveis com emoji.

- [x] Tab bar: Início / Gastos / Receitas / Gráficos / Metas / Perfil
- [x] Gastos e Receitas com lista filtrada por tipo + FAB pré-preenche tipo
- [x] MonthContext compartilhado entre todas as abas
- [x] Tela de Perfil: email, logout, gerenciar categorias
- [x] Categorias custom: nome + emoji, CRUD via API, seed 6 padrões no primeiro login
- [x] FormScreen usa categorias dinâmicas da API

---

## v1.8 — Gráficos & Metas ✅ (concluído)

**Objetivo:** Visualização financeira + objetivos de poupança.

- [x] GraficosScreen: PieChart (donut) despesas por categoria
- [x] GraficosScreen: LineChart saldo dos últimos 6 meses (área, curva)
- [x] GraficosScreen: card resumo receitas / despesas / saldo
- [x] MetasScreen: metas de poupança com barra de progresso
- [x] MetasScreen: quick-add (+50/100/200/500), celebração ao completar
- [x] MetasScreen: CRUD de metas com emoji picker

---

## v1.9 — Temas, Busca, Notificações & Export ✅ (concluído)

**Objetivo:** Personalização, produtividade e portabilidade de dados.

- [x] 6 temas visuais: Dark, Bob Esponja, Naruto, Lo-fi, Matrix, Ocean
- [x] ThemeContext com persistência via AsyncStorage
- [x] Temas aplicados a todos os screens e componentes
- [x] Busca + filtros em GastosScreen (texto, categoria, ordenação)
- [x] Busca + filtros em ReceitasScreen
- [x] Notificações locais: lembrete diário às 20h (toggle no Perfil)
- [x] Export CSV do mês via share sheet (Perfil)
- [x] Sugestão de categoria no FormScreen (debounce 400ms, baseado em histórico)
- [x] OTA updates via expo-updates (verifica ao abrir em produção)

---

## v1.10 — Premium Dark UI & Animations ✅ (concluído)

**Objetivo:** Frontend de verdade — design system consistente, animações reais, estética fintech premium.

- [x] Design system novo: 13 tokens (`bg`, `surface`, `card`, `border`, `accent`, `accentDim`, `danger`, `text`, `textSub`, `textMuted`, `tabBar`) — 5 níveis de profundidade
- [x] Todos os 6 temas atualizados com paleta mais profunda
- [x] `AmountText` — contador animado com requestAnimationFrame + easeOutCubic, `fontVariant: tabular-nums`
- [x] `AnimatedListItem` — entrada escalonada (stagger 40ms) com Reanimated slide-up + fade
- [x] `GradientCard` — wrapper LinearGradient reutilizável
- [x] `SwipeableCard` — swipe-to-delete com Gesture Handler + Reanimated
- [x] `ExpenseCard` redesenhado — icon bubble 46px, tipografia melhorada, ícone dinâmico via CategoryContext
- [x] `HomeScreen` — hero card com LinearGradient, saldo 40px animado, barra de accent dinâmica
- [x] `GastosScreen` + `ReceitasScreen` — SectionList com agrupamento por data (Hoje/Ontem/data)
- [x] `FormScreen` — tokens atualizados, visual mais limpo
- [x] Todos os screens: tokens corrigidos (`textSub` para labels, `surface` para containers)
- [x] `TabNavigator` — `useSafeAreaInsets` para Android gesture nav bar
- [x] `App.tsx` — `GestureHandlerRootView` + `SafeAreaProvider` (fix barra branca + botões sobrepostos)
- [x] APK novo gerado via EAS Build — ativa canal OTA "preview" + expo-notifications nativo
- [x] `MetasScreen` + `ProfileScreen` — action buttons texto (sem emoji), goal cards com border

---

## v2.0 — Inteligência & UX Avançada

**Objetivo:** App aprende padrões e reduz ainda mais o trabalho manual.

- [ ] **ML de categoria** — modelo local aprende com histórico do usuário
- [ ] **iOS build** — configurar perfil no EAS para App Store
- [ ] **Widget Android** — total do mês na tela inicial
- [ ] **Relatório mensal** — PDF com gráficos e resumo

---

## v2.1 — Social & Compartilhamento

- [ ] Compartilhar resumo mensal como imagem (story financeiro)
- [ ] Múltiplas carteiras (dinheiro, débito, crédito)
- [ ] Importar extrato bancário CSV

---

## Backlog (sem versão definida)

- [ ] Scan de nota fiscal via câmera (OCR)
- [ ] Open Finance / integração bancária (longo prazo)
- [ ] Testes automatizados (débito técnico — ver CONCERNS.md C-03)
- [ ] Migrar API para provider sem cold start (ver CONCERNS.md C-05)
- [ ] Realtime sync via Supabase Realtime (multi-device)

---

## Descartado

| Feature | Motivo |
| --- | --- |
| Login social (Google/Apple) | Complexidade desnecessária para MVP |
| Admin panel | App é personal, sem gestão multi-tenant |
| Integração bancária (curto prazo) | Requer Open Finance API, complexidade alta |
