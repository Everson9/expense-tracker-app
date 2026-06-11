# Testing Infrastructure

## Test Frameworks

**Unit/Integration:** nenhum instalado
**E2E:** nenhum instalado
**Coverage:** nenhum configurado

## Test Organization

**Location:** sem diretório de testes
**Naming:** sem convenção estabelecida
**Structure:** N/A

## Testing Patterns

### Unit Tests
**Approach:** não implementado
**Location:** N/A

### Integration Tests
**Approach:** não implementado
**Location:** N/A

### E2E Tests
**Approach:** não implementado
**Location:** N/A

## Test Execution

**Commands:** nenhum script de teste em `package.json`
**Configuration:** N/A

## Coverage Targets

**Current:** 0% (sem testes)
**Goals:** não documentado
**Enforcement:** nenhuma

## Test Coverage Matrix

| Code Layer | Required Test Type | Location Pattern | Run Command |
|---|---|---|---|
| expenseController | integration | `__tests__/controllers/` | a definir |
| expenseService (app) | unit (mock axios) | `__tests__/services/` | a definir |
| HomeScreen | e2e / component | a definir | a definir |
| FormScreen | e2e / component | a definir | a definir |

## Parallelism Assessment

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
|---|---|---|---|
| unit | Sim | sem estado compartilhado | a implementar |
| integration (API) | Não sem isolamento | Supabase compartilhado | mesmo Supabase para dev e prod |

## Gate Check Commands

| Gate Level | When to Use | Command |
|---|---|---|
| Quick | após mudanças isoladas | a definir |
| Full | antes de build | a definir |
| Build | release | `eas build --profile preview --platform android` |

> **Nota:** testes são gap crítico — ver CONCERNS.md
