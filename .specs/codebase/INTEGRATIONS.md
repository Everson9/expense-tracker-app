# External Integrations

## Database / BaaS

**Service:** Supabase
**Purpose:** PostgreSQL gerenciado — armazenamento de gastos
**Implementation:** `expense-tracker-api/src/config/supabase.ts`
**Configuration:** `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` via `.env`
**Authentication:** service role key (acesso admin completo, bypass RLS)

```ts
// expense-tracker-api/src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
```

**Tabelas usadas:** `expenses`
**RLS:** provavelmente desabilitado ou bypassed pela service key

## API Hosting

**Service:** Render.com (free tier)
**Purpose:** Host da Express API
**URL produção:** `https://expense-tracker-api-xhgh.onrender.com`
**Comportamento:** instância dorme após inatividade — cold start ~30-60s
**Deploy:** automático via push no branch conectado

## Build & Distribution

**Service:** Expo Application Services (EAS)
**Purpose:** Build nativo de APK/AAB sem Mac físico
**EAS Project ID:** `2dedd993-751a-480f-abcd-eeda0f60ed63`
**Owner:** `evsodev`
**Config:** `expense-tracker-app/eas.json`
**Profiles:**
- `preview` → APK para Android (testes)
- `production` → AAB para Google Play

## API REST (interno)

**Purpose:** Interface entre app mobile e banco de dados
**Location:** `expense-tracker-api/src/`
**Authentication:** nenhuma (API pública — sem JWT, sem API key)
**Base URL:** `https://expense-tracker-api-xhgh.onrender.com/api`

| Endpoint | Método | Descrição |
|---|---|---|
| `/expenses` | GET | Lista todos os gastos |
| `/expenses/:id` | GET | Busca gasto por ID |
| `/expenses` | POST | Cria gasto |
| `/expenses/:id` | PUT | Atualiza gasto |
| `/expenses/:id` | DELETE | Remove gasto |
| `/health` | GET | Health check |

## Webhooks

Nenhum configurado.

## Background Jobs

Nenhum configurado.
