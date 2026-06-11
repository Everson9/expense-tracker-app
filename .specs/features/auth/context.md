# Auth — Decisões do Usuário

**Registrado em:** 2026-06-11

## Dados existentes no banco

**Decisão:** Descartar dados sem `user_id`.

**Razão:** App era single-user sem auth. Dados de desenvolvimento não têm valor para produção. Banco limpa na migração — coluna `user_id NOT NULL` será adicionada, o que naturalmente invalida registros sem dono.

**Impacto:** Migration SQL deve fazer `TRUNCATE expenses` antes de adicionar a constraint.

---

## Confirmação de e-mail

**Decisão:** Exigir confirmação de e-mail antes de permitir login.

**Razão:** Segurança básica — garante que o e-mail pertence ao usuário. Supabase envia o e-mail automaticamente; basta manter a opção habilitada no dashboard.

**Impacto:** LoginScreen deve exibir mensagem específica quando Supabase retorna `email_not_confirmed`. SignupScreen deve mostrar estado "verifique seu inbox" após cadastro.
