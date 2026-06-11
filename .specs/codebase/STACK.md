# Tech Stack

**Analyzed:** 2026-06-11

## Core

- Language: TypeScript 5.3
- Package manager: npm

## Mobile (expense-tracker-app)

- Framework: React Native 0.81.5
- Runtime: Expo SDK 54
- Navigation: React Navigation v7 (native-stack)
- HTTP client: Axios 1.7.7
- Build: EAS Build (eas-cli ≥ 16.0.0)
- State: local `useState` (sem gerenciador global)

## Backend (expense-tracker-api)

- Runtime: Node.js
- Framework: Express
- API style: REST
- ORM/DB client: Supabase JS SDK (service role key)
- Database: PostgreSQL via Supabase
- Auth: sem auth (nenhum middleware de autenticação implementado)

## Testing

- Unit: nenhum framework instalado
- Integration: nenhum
- E2E: nenhum

## External Services

- Database/BaaS: Supabase (PostgreSQL gerenciado)
- API hosting: Render.com (free tier)
- Build/Distribution: Expo Application Services (EAS)

## Development Tools

- TypeScript: ts-node + nodemon (API), tsc (app)
- Linting: nenhum configurado
- Env vars: dotenv (API), EXPO_PUBLIC_* (app via eas.json)
