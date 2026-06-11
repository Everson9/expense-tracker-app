# v1.7 Tasks

**Status:** Ready  
**Last updated:** 2026-06-11

---

## T-01 — Supabase: categories table + RLS + seed logic
**Status:** DONE  
**What:** Create `categories` table, RLS policy, seed defaults via API  
**Where:** Supabase SQL editor + `expense-tracker-api/src/controllers/categoryController.ts`  
**Done when:** GET /api/categories returns 6 defaults for new user, RLS blocks cross-user access  
**SQL:**
```sql
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default '📦',
  created_at timestamptz default now(),
  unique (user_id, name)
);
alter table categories enable row level security;
create policy "users manage own categories"
  on categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

---

## T-02 — API: categories controller + routes
**Status:** TODO  
**What:** CRUD endpoints for categories with auto-seed on first GET  
**Where:** `expense-tracker-api/src/controllers/categoryController.ts`, `src/routes/categoryRoutes.ts`, `src/server.ts`  
**Depends on:** T-01  
**Done when:** GET/POST/PUT/DELETE /api/categories all work with JWT; GET seeds defaults if 0 rows

---

## T-03 — App: CategoryContext + categoryService
**Status:** TODO  
**What:** Context that loads categories once and exposes them app-wide  
**Where:** `expense-tracker-app/src/contexts/CategoryContext.tsx`, `src/services/api.ts`  
**Done when:** `useCategories()` returns `{ categories, loading, reload }` from API; wrapped in App.tsx

---

## T-04 — App: MonthContext (shared month state)
**Status:** TODO  
**What:** Context for selectedMonth/selectedYear shared across tabs  
**Where:** `expense-tracker-app/src/contexts/MonthContext.tsx`  
**Done when:** `useMonth()` returns `{ selectedMonth, selectedYear, goToPrev, goToNext }` used by all tab screens

---

## T-05 — App: TabNavigator + navigation restructure
**Status:** TODO  
**Depends on:** T-04  
**What:** Replace AppNavigator stack with BottomTabNavigator (4 tabs) + nested stack for Form  
**Where:** `expense-tracker-app/src/navigation/TabNavigator.tsx`, update `RootNavigator.tsx`  
**Done when:** 4 tabs render, Form screen accessible from Gastos/Receitas tabs, back navigation works

---

## T-06 — App: GastosScreen + ReceitasScreen
**Status:** TODO  
**Depends on:** T-04, T-05  
**What:** Filtered list screens — despesa-only and receita-only, same month selector, FAB pre-fills type  
**Where:** `expense-tracker-app/src/screens/GastosScreen.tsx`, `ReceitasScreen.tsx`  
**Done when:** Lists filter correctly, FAB navigates to Form with correct type pre-filled

---

## T-07 — App: HomeScreen cleanup
**Status:** TODO  
**Depends on:** T-03, T-04  
**What:** Remove FAB, use MonthContext instead of local state, use CategoryContext for budget icons  
**Where:** `expense-tracker-app/src/screens/HomeScreen.tsx`  
**Done when:** No FAB on Início, month changes propagate to other tabs, category icons dynamic

---

## T-08 — App: ProfileScreen + CategoryModal
**Status:** TODO  
**Depends on:** T-03, T-05  
**What:** Profile tab with user info, logout, category CRUD list, add/edit modal  
**Where:** `expense-tracker-app/src/screens/ProfileScreen.tsx`  
**Done when:** User sees email, can logout, can create/edit/delete categories with emoji picker

---

## T-09 — App: FormScreen uses dynamic categories
**Status:** TODO  
**Depends on:** T-03  
**What:** Category picker uses `useCategories()` instead of hardcoded array; stores category_id + name  
**Where:** `expense-tracker-app/src/screens/FormScreen.tsx`  
**Done when:** Custom categories appear in picker; selecting one saves both id and name

---

## T-10 — Commit + push + rebuild APK
**Status:** TODO  
**Depends on:** T-01..T-09  
**What:** Commit both repos, push, trigger EAS build  
**Done when:** APK link available with v1.7 features

---

## Execution order

```
T-01 (SQL) → T-02 (API) → [T-03, T-04] in parallel → T-05 → [T-06, T-07, T-08, T-09] in parallel → T-10
```
