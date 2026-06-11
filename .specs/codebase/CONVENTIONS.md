# Code Conventions

## Naming Conventions

**Files:** PascalCase para components/screens, camelCase para services/config/models
- Examples: `HomeScreen.tsx`, `ExpenseCard.tsx`, `expenseController.ts`, `api.ts`, `supabase.ts`

**Functions/Methods:** camelCase
- Examples: `fetchExpenses`, `handleDelete`, `getAll`, `formatBRL`

**Variables:** camelCase
- Examples: `totalMonth`, `totalGeral`, `expenseService`

**Types/Interfaces:** PascalCase
- Examples: `Expense`, `CreateExpenseDTO`, `UpdateExpenseDTO`, `Category`, `RootStackParamList`

**Constants:** camelCase (sem SCREAMING_SNAKE)
- Examples: `const TABLE = 'expenses'`, `const API_URL = ...`

## Code Organization

**Import ordering (observado em server.ts, api.ts):**
1. Packages externos
2. Imports internos relativos

**File structure (controllers):**
- Imports no topo
- Constante de tabela
- Funções exportadas individualmente (sem classe)

**File structure (screens):**
- Imports React/RN
- Imports de navegação
- Imports locais (types, services, components)
- Componente default function
- StyleSheet.create() no final do arquivo

## Type Safety

**Approach:** TypeScript strict sem `any` explícito. DTOs tipados. Props de navegação via generics do React Navigation.
```ts
// Exemplo de tipagem de props de tela
type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
```

## Error Handling

**API:** Retorna `res.status(xxx).json({ error: message })` em todos os erros. Sem middleware global de erro.
**App:** `try/catch` em todas as funções async de fetch. Erro exibido via `Alert.alert('Erro', mensagem)`.

```ts
// Padrão observado em HomeScreen e FormScreen
} catch {
  Alert.alert('Erro', 'Não foi possível carregar os gastos.');
}
```

## Comments

Sem comentários inline. Código auto-explicativo por naming. Único uso: comentário de seção (`// Routes`, `// Health check`, `// FAB`).

## Styling (App)

`StyleSheet.create()` sempre no final do arquivo da tela/componente. Cores hardcoded como constantes inline (sem tema global):
- Background: `#0D0D0D`
- Surface: `#1A1A1A`
- Accent: `#00D4A1`
- Text primary: `#F5F5F5`
- Text muted: `#666`, `#555`, `#888`
