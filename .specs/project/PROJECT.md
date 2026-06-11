# Organizador de Gastos

**Vision:** App mobile fullstack para registro e acompanhamento de gastos pessoais, com interface dark minimalista e sync em nuvem.
**For:** Uso pessoal (usuário único por enquanto — sem multi-tenant)
**Solves:** Falta de visibilidade sobre gastos mensais de forma rápida e mobile-first

## Goals

- Registrar gastos com categoria, valor e data em menos de 30 segundos
- Visualizar total mensal e geral em destaque na tela principal
- Persistir dados na nuvem e acessar via APK em qualquer dispositivo Android

## Tech Stack

**Core:**
- Framework: React Native + Expo SDK 54
- Language: TypeScript
- API: Express (Node.js)
- Database: Supabase (PostgreSQL)

**Key dependencies:** Axios, React Navigation v7, EAS Build, Render.com

## Scope

**v1.0 (concluído):**
- CRUD completo de gastos (título, valor, categoria, data, descrição opcional)
- 6 categorias fixas: alimentação, transporte, lazer, saúde, moradia, outros
- Resumo financeiro: total do mês atual + total geral
- Dark theme consistente
- APK Android via EAS Build
- API deployada no Render

**Próximas versões (backlog — ver ROADMAP.md):**
- Autenticação por usuário
- Filtros e gráficos
- iOS

**Explicitamente fora do escopo atual:**
- Web app
- Notificações push
- Export de relatórios
- Integração bancária

## Constraints

- Timeline: sem deadline — projeto pessoal, ritmo livre
- Technical: sem Mac físico → iOS build só via EAS Cloud
- Resources: free tier (Render + Supabase + EAS) — monitorar limites ao escalar
