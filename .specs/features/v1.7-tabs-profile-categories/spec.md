# v1.7 — Tab Navigation + Profile + Custom Categories

**Status:** Specified  
**Last updated:** 2026-06-11

---

## Goal

Replace stack-only navigation with a bottom tab bar. Add a Profile tab for account management. Let users create custom categories with emoji icons instead of being limited to the 6 hardcoded ones.

## Design constraint (inherited)

> ≤ 3 taps to register a gasto. Tab navigation must not add friction to the core flow.

---

## Requirements

### TAB-01 — Bottom tab bar
- 4 tabs: **Início**, **Gastos**, **Receitas**, **Perfil**
- Icons: 🏠 / 💸 / 💰 / 👤
- Active tab highlighted with `#00D4A1`
- Tab bar background: `#111111`, border top `#1A1A1A`
- FAB (+) visible on Gastos and Receitas tabs, pre-fills type on open

### TAB-02 — Início tab
- Current HomeScreen content unchanged (summary + budget breakdown)
- FAB removed from Início (add via Gastos/Receitas tabs)

### TAB-03 — Gastos tab
- List only `type === 'despesa'` for selected month
- Same month selector as Início
- FAB pre-fills `type: 'despesa'` on FormScreen open

### TAB-04 — Receitas tab
- List only `type === 'receita'` for selected month
- Same month selector as Início
- FAB pre-fills `type: 'receita'` on FormScreen open

### TAB-05 — Month selector shared state
- Selected month/year shared across Início, Gastos, Receitas tabs
- Changing month in any tab updates all three

---

### PROF-01 — Profile screen
- Header: user avatar placeholder (initials from email), email (read-only)
- Section "Conta": button "Sair" with confirmation dialog
- Section "Categorias": list of user's categories with emoji + name + edit/delete
- Button "Nova categoria" opens category form modal

### PROF-02 — Category management modal
- Fields: emoji picker (grid of common emojis) + name (text input)
- Validation: name required, min 2 chars, max 30 chars, unique per user
- Save → POST /api/categories
- Edit → PUT /api/categories/:id
- Delete → DELETE /api/categories/:id (with confirmation if category has expenses)

---

### CAT-01 — Categories API
- Table `categories` in Supabase: `id`, `user_id`, `name`, `icon` (emoji), `created_at`
- RLS: users see/manage only their own categories
- Endpoints: GET / POST / PUT /:id / DELETE /:id
- All protected by verifyJWT middleware

### CAT-02 — Seed default categories on first login
- On GET /api/categories, if user has 0 categories → seed 6 defaults and return them
- Defaults: alimentação 🍔 / transporte 🚗 / lazer 🎮 / saúde 💊 / moradia 🏠 / outros 📦

### CAT-03 — FormScreen uses dynamic categories
- CategoryPicker loads from API (via context or local fetch)
- Falls back to hardcoded 6 if API fails
- Category stored as `category_id` (UUID) + `category_name` (string snapshot for display)

### CAT-04 — HomeScreen + ExpenseCard use dynamic categories
- BudgetSection uses categories from API (icon + name)
- ExpenseCard shows category icon from loaded list; falls back to 📦

---

## Out of scope (v1.7)

- Color per category (v2.0)
- Category reorder / drag-and-drop
- Category usage stats
- Password change in profile
- Avatar upload

---

## Migration note

`expenses.category` currently stores string literal (e.g. `"alimentação"`). In v1.7 we add `category_id uuid` column but keep `category` string for backwards compatibility. New expenses write both fields. Old expenses display via `category` string fallback.
