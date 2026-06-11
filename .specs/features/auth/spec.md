# Auth Specification

## Problem Statement

API e dados são completamente públicos — qualquer pessoa com a URL pode ler, criar e deletar gastos. Não há isolamento por usuário. Antes de qualquer uso real, é necessário autenticação com dados segregados por conta.

## Goals

- [ ] Usuário pode criar conta e logar com e-mail + senha
- [ ] Cada usuário vê e gerencia somente seus próprios gastos
- [ ] Sessão persiste entre fechamentos do app
- [ ] API rejeita requests sem JWT válido

## Out of Scope

| Feature | Reason |
|---|---|
| Login social (Google, Apple) | Complexidade de configuração; MVP não precisa |
| Perfil/avatar de usuário | Fora do escopo do app de gastos |
| Troca de e-mail/senha | P3 — pode vir depois |
| Admin panel | Não há gestão multi-usuário necessária |
| Migração de dados existentes | Decisão: banco limpa, dados sem user_id descartados |

---

## User Stories

### P1: Cadastro de conta ⭐ MVP

**User Story:** Como usuário novo, quero criar uma conta com e-mail e senha para ter acesso exclusivo aos meus gastos.

**Why P1:** Sem cadastro não há auth.

**Acceptance Criteria:**

1. WHEN usuário preenche e-mail válido + senha ≥ 6 chars e toca "Criar conta" THEN sistema SHALL criar conta no Supabase Auth e enviar e-mail de confirmação
2. WHEN cadastro enviado com sucesso THEN sistema SHALL exibir tela/mensagem informando que confirmação foi enviada por e-mail
3. WHEN e-mail já cadastrado THEN sistema SHALL exibir erro "E-mail já está em uso"
4. WHEN senha < 6 caracteres THEN sistema SHALL exibir erro de validação antes de submeter
5. WHEN e-mail inválido THEN sistema SHALL exibir erro de validação antes de submeter

**Independent Test:** Criar conta com e-mail novo → ver mensagem de confirmação → checar inbox.

---

### P1: Login ⭐ MVP

**User Story:** Como usuário cadastrado e confirmado, quero logar com e-mail e senha para acessar meus gastos.

**Why P1:** Core da feature.

**Acceptance Criteria:**

1. WHEN usuário preenche e-mail + senha corretos e toca "Entrar" THEN sistema SHALL autenticar, salvar sessão localmente e navegar para HomeScreen
2. WHEN credenciais incorretas THEN sistema SHALL exibir "E-mail ou senha incorretos"
3. WHEN e-mail não confirmado THEN sistema SHALL exibir "Confirme seu e-mail antes de entrar"
4. WHEN campos em branco THEN sistema SHALL bloquear submit com erro de validação
5. WHEN login bem-sucedido THEN JWT SHALL ser enviado em todos os requests para a API

**Independent Test:** Logar com conta confirmada → ver HomeScreen → checar que requests têm `Authorization: Bearer <token>`.

---

### P1: Sessão persistente ⭐ MVP

**User Story:** Como usuário logado, quero que o app lembre minha sessão para não precisar logar toda vez.

**Why P1:** Sem persistência o app é inutilizável no dia a dia.

**Acceptance Criteria:**

1. WHEN app é fechado e reaberto com sessão válida THEN sistema SHALL ir direto para HomeScreen sem pedir login
2. WHEN sessão expirada ou inválida THEN sistema SHALL redirecionar para LoginScreen
3. WHEN app abre pela primeira vez (sem sessão) THEN sistema SHALL mostrar LoginScreen

**Independent Test:** Logar → fechar app completamente → reabrir → ver HomeScreen direto.

---

### P1: Logout ⭐ MVP

**User Story:** Como usuário logado, quero sair da minha conta para proteger meus dados.

**Why P1:** Sem logout a sessão fica presa.

**Acceptance Criteria:**

1. WHEN usuário toca "Sair" THEN sistema SHALL invalidar sessão local e no Supabase e navegar para LoginScreen
2. WHEN logout bem-sucedido THEN sistema SHALL limpar todos os dados de sessão do dispositivo
3. WHEN próximo request após logout THEN API SHALL receber 401 (sem token)

**Independent Test:** Logar → sair → tentar voltar com botão físico → ver LoginScreen, não HomeScreen.

---

### P1: Isolamento de dados (RLS) ⭐ MVP

**User Story:** Como usuário, quero que meus gastos sejam privados e que eu nunca veja dados de outros usuários.

**Why P1:** Sem RLS a auth é cosmética — dados ainda são acessíveis.

**Acceptance Criteria:**

1. WHEN usuário A faz GET /api/expenses THEN API SHALL retornar somente gastos com `user_id = A`
2. WHEN usuário A tenta acessar gasto de usuário B via GET /api/expenses/:id THEN API SHALL retornar 404
3. WHEN POST /api/expenses THEN API SHALL injetar `user_id` do JWT automaticamente (usuário não envia user_id)
4. WHEN request sem JWT válido THEN API SHALL retornar 401 em todas as rotas de expenses

**Independent Test:** Criar gasto com user A → logar como user B → ver que gasto de A não aparece.

---

### P2: Recuperação de senha

**User Story:** Como usuário que esqueceu a senha, quero receber um e-mail para redefiní-la.

**Why P2:** Importante para UX mas não bloqueia o MVP.

**Acceptance Criteria:**

1. WHEN usuário toca "Esqueci minha senha" e informa e-mail THEN sistema SHALL enviar e-mail de reset via Supabase
2. WHEN e-mail não cadastrado THEN sistema SHALL exibir mensagem genérica (não revelar se e-mail existe)

**Independent Test:** Informar e-mail cadastrado → receber e-mail de reset → redefinir senha → logar com nova senha.

---

## Edge Cases

- WHEN token expirado durante uso do app THEN sistema SHALL tentar refresh automático; se falhar, redirecionar para LoginScreen
- WHEN app fica offline e token expira THEN sistema SHALL mostrar erro de rede, não tela de login
- WHEN Supabase Auth retorna erro desconhecido THEN sistema SHALL exibir "Erro ao autenticar. Tente novamente."
- WHEN usuário tenta acessar rota da API com token de outro ambiente THEN API SHALL retornar 401

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| AUTH-01 | P1: Cadastro — criar conta + enviar confirmação | Design | Pending |
| AUTH-02 | P1: Cadastro — validação client-side | Design | Pending |
| AUTH-03 | P1: Cadastro — e-mail já em uso | Design | Pending |
| AUTH-04 | P1: Login — autenticar + salvar sessão + navegar | Design | Pending |
| AUTH-05 | P1: Login — credenciais inválidas | Design | Pending |
| AUTH-06 | P1: Login — e-mail não confirmado | Design | Pending |
| AUTH-07 | P1: Sessão — persistir entre aberturas | Design | Pending |
| AUTH-08 | P1: Sessão — redirecionar se expirada | Design | Pending |
| AUTH-09 | P1: Logout — invalidar + navegar para Login | Design | Pending |
| AUTH-10 | P1: RLS — filtrar gastos por user_id na API | Design | Pending |
| AUTH-11 | P1: RLS — injetar user_id no create (não cliente) | Design | Pending |
| AUTH-12 | P1: RLS — 401 em requests sem JWT | Design | Pending |
| AUTH-13 | P2: Recuperação de senha | - | Pending |

**Coverage:** 13 total, 0 mapeados para tasks, 13 pendentes ⚠️

---

## Success Criteria

- [ ] Usuário consegue criar conta, confirmar e-mail, logar e ver HomeScreen
- [ ] Fechar e reabrir o app mantém sessão ativa
- [ ] Usuário B nunca vê gastos de usuário A
- [ ] API retorna 401 para qualquer request sem token
- [ ] Logout limpa sessão completamente
