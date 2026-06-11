# State

**Last updated:** 2026-06-11 (sessão 3)

## Decisions

| ID | Decision | Reason |
|---|---|---|
| D-01 | API própria (Express) em vez de Supabase direct do app | Service key nunca exposta no cliente mobile |
| D-02 | EAS Build para APK | Sem Mac físico — único caminho viável |
| D-03 | Render free tier | Zero custo para MVP |
| D-04 | EXPO_PUBLIC_* em eas.json (não em .env commitado) | .env no .gitignore — vars públicas declaradas no build profile |

## Blockers

Nenhum ativo.

## Lessons Learned

- L-01: EXPO_PUBLIC_* vars são baked in build time. Se .env está no .gitignore e EAS não tem `env` no profile, o fallback `localhost:3000` é usado no APK — app não conecta à API. Fix: declarar vars em `eas.json > build > [profile] > env`.
- L-02: `animatedProps` do Reanimated 3 em `Text` é instável para contadores de valor. Usar `requestAnimationFrame` atualizando state React é mais confiável.
- L-03: `GestureHandlerRootView` deve ser o wrapper mais externo em `App.tsx`; sem ele, `Gesture.Pan()` silencia sem erro.
- L-04: `SafeAreaProvider` obrigatório no `App.tsx` para `useSafeAreaInsets()` funcionar no `TabNavigator` — sem ele, tab bar sobrepõe botões de navegação Android.
- L-05: `ExpenseCard` com ícones hardcoded quebra para categorias custom do usuário. Fix: lookup via `useCategories()` + hash de cor para categorias não mapeadas.

## Todos

- [x] Rebuild APK após fix do eas.json — feito, v1.6 APK gerado 2026-06-11
- [x] Implementar auth (v1.1) — concluído
- [x] v1.2 navegação temporal — concluído
- [x] v1.3 receitas + saldo — concluído
- [x] v1.4 recorrentes — concluído
- [x] v1.5 parcelamento — concluído
- [x] v1.6 orçamento por categoria — concluído
- [x] v1.7 tabs + perfil + categorias custom — concluído
- [x] v1.8 gráficos (PieChart + LineChart) + metas de poupança — concluído
- [x] v1.9 temas (6), busca/filtros, notificações, export CSV, sugestão de categoria, OTA — concluído
- [x] Novo APK build (v1.10) — canal OTA "preview" ativo, expo-notifications funcionando — 2026-06-11

## Deferred Ideas

- Realtime sync via Supabase Realtime (útil para multi-device ou multi-user)
- Widget Android de total do mês
- Scan de nota fiscal via câmera (OCR)
- iOS build no EAS (requer conta Apple Developer)
