---
status: current
wave: 4
session: wave-4--cc
---

# PRP-009 — Gestao de Usuarios (Backend + Central UI)

## Objetivo

Implementar o backend de gestao de usuarios (listar, editar, desativar, alterar role, reset senha) e a tela UsuariosPage na Central com filtros, busca e acoes em massa.

## Execution Mode

`implementar`

## Contexto

A Central ja tem paginas MotoboysPage e LojistasPage em `apps/central/src/pages/` que listam motoboys e lojistas separadamente, com busca e filtros basicos. Essas paginas usam hooks com React Query e fazem chamadas aos endpoints /api/couriers e /api/shops.

A tabela profiles contem todos os usuarios com campos id, company_id, role, full_name, phone, avatar_url, active, timestamps. A tabela auth.users (Supabase GoTrue) contem email e app_metadata.

O backend nao tem endpoint dedicado para listar todos os profiles de uma empresa. Os endpoints de couriers e shops retornam dados especificos de cada role. Para gestao unificada, sera necessario um novo router `users.ts`.

O PRP-002 implementara requireRole. O PRP-005 implementara o endpoint PATCH /profiles/me para edicao do proprio perfil. Este PRP implementa edicao de QUALQUER usuario da empresa pelo operador.

A Supabase Admin API (`supabase.auth.admin`) oferece `updateUserById`, `deleteUser`, `listUsers`, `generateLink({ type: 'recovery' })` para reset de senha.

## Especificacao

### 1. Backend — Criar `apps/backbone/src/routes/users.ts`

Conforme OSD100-OSD110 e matriz de permissoes:

**GET /api/users** — requireRole('operator', 'super_admin'). Lista todos os profiles da empresa do usuario autenticado (filtrado por company_id). Parametros query opcionais:
- `role` — filtro por role (operator, shop, courier)
- `active` — filtro por status (true/false)
- `search` — busca por full_name ou email (ILIKE %search%). Para obter email, fazer join com auth.users via Supabase Admin API ou via tabela auth.users direta
- Retorna array de objetos com: id, full_name, phone, email, role, avatar_url, active, created_at, updated_at

**PATCH /api/users/:id** — requireRole('operator', 'super_admin'). Editar dados de um usuario da empresa. Validar que o usuario alvo pertence a mesma empresa (ou super_admin). Campos editaveis: full_name, phone, email, role, active. Sincronizar alteracoes com Supabase Auth (user_metadata, app_metadata.role) conforme OSD067. Retorna profile atualizado.

**PATCH /api/users/:id/status** — requireRole('operator', 'super_admin'). Ativar/desativar usuario. Atualizar `profiles.active` e `auth.users.banned` (ou mecanismo equivalente no GoTrue) para impedir login. Retorna `{ ok: true }`.

**POST /api/users/:id/reset-password** — requireRole('operator', 'super_admin'). Enviar email de reset de senha via `supabase.auth.admin.generateLink({ type: 'recovery', email })` conforme OSD108. Retorna `{ ok: true }`.

### 2. Backend — Criar Zod schemas

Em `packages/shared/schemas/src/user-management.ts`:
- `ListUsersQuerySchema`: role (enum opcional), active (boolean opcional), search (string opcional)
- `UpdateUserSchema`: full_name, phone, email, role, active (todos opcionais)
- Exportar do index.ts

### 3. Frontend — Criar UsuariosPage na Central

Conforme US040-US044, OSD100-OSD110:

**Localizacao:** `apps/central/src/pages/UsuariosPage.tsx`

**Layout:**
- Header com titulo "Usuarios" e botao "Convidar" (link para flow de invite existente)
- Barra de filtros: dropdown de role (Todos, Operador, Lojista, Motoboy), dropdown de status (Todos, Ativo, Inativo), campo de busca com debounce 300ms (OSD103)
- Grid responsivo: tabela em desktop (>768px), cards em mobile (<768px) (OSD104)
- Cada item mostra: avatar (AvatarDisplay), nome, role badge (cor por role), status badge (verde/vermelho), email, ultima atividade (OSD109)
- Checkbox para selecao multipla em desktop (OSD110)

**Acoes por usuario:**
- Botao/menu "Editar" — abre dialog com formulario (nome, telefone, email, role dropdown) (US041)
- Botao "Desativar"/"Reativar" — dialog de confirmacao (US042)
- Botao "Alterar papel" — dropdown no dialog de edicao (US043)
- Botao "Resetar senha" — confirmacao, chama POST /api/users/:id/reset-password (US044)

**Acoes em massa (OSD110):**
- Ao selecionar multiplos usuarios, exibir toolbar flutuante com "Desativar selecionados" e total selecionado

### 4. Frontend — Hooks

Em `apps/central/src/hooks/useUsers.ts`:
- `useUsers(filters)` — useQuery para GET /api/users com query params
- `useUpdateUser()` — useMutation para PATCH /api/users/:id
- `useToggleUserStatus()` — useMutation para PATCH /api/users/:id/status
- `useResetPassword()` — useMutation para POST /api/users/:id/reset-password
- `useBulkDeactivate()` — loop de chamadas ou endpoint batch (se implementado)

### 5. Frontend — Adicionar rota e navegacao

Adicionar rota `/usuarios` no App.tsx da Central. Adicionar item "Usuarios" no sidebar/nav da Central.

## Limites

- NAO substituir as paginas MotoboysPage e LojistasPage existentes — a UsuariosPage e complementar (visao unificada), as paginas especificas continuam existindo
- NAO implementar paginacao server-side — carregar todos (RNF007 garante ate 100 registros por empresa)
- NAO implementar criacao de usuario — usar o flow de invite existente (POST /api/auth/invite)
- NAO implementar exclusao permanente de usuario — apenas desativacao (active = false)
- NAO alterar PATCH /profiles/me (PRP-005) — este PRP cria endpoints separados para edicao por operador
