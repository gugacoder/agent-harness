---
status: current
wave: 4
session: wave-4--cc
---

# PRP-011 — Self-Registration (Backend + Frontend)

## Objetivo

Implementar fluxo de auto-cadastro para motoboys e lojistas (sem invite do operador), com formulario publico, armazenamento de solicitacao pendente, aprovacao pelo operador na Central e notificacao.

## Execution Mode

`implementar`

## Contexto

Atualmente o unico mecanismo de criacao de usuarios e o endpoint POST /api/auth/invite em `apps/backbone/src/routes/auth.ts`, que exige role operator e envia invite via Supabase Admin API.

O PRP-001 criara a tabela `registration_requests` com campos: id, company_id, full_name, phone, email, requested_role, status (pending/approved/rejected), extra_data (jsonb), requested_at, reviewed_at, reviewed_by.

O PRP-003 implementara o servico OTP para verificacao de telefone — o auto-cadastro pode exigir verificacao de telefone via OTP antes de submeter a solicitacao.

A LoginPage de cada app (Motoboy, Lojista) ja existe. O PRP-008 adicionara o fluxo OTP a essas paginas. O link "Criar conta" sera adicionado por este PRP.

O SSE (Server-Sent Events) ja existe em `apps/backbone/src/routes/events.ts` e o frontend da Central escuta eventos via EventSource. Este mecanismo pode ser usado para notificar o operador de novos cadastros (OSD133).

## Especificacao

### 1. Backend — Rotas de registration em `apps/backbone/src/routes/registration.ts`

**POST /api/registration/request** — publico (sem auth). Criar solicitacao de auto-cadastro conforme OSD130, OSD131:
- Input: company_id (obrigatorio — o app precisa saber a qual empresa se registrar), full_name, phone, email (opcional), requested_role ('courier' ou 'shop'), extra_data (jsonb — vehicle_type, plate para courier; trade_name para shop)
- Validar que nao existe registration_request pendente com mesmo phone + company_id
- Validar que nao existe profile com mesmo phone + company_id (ja cadastrado)
- Salvar em registration_requests com status 'pending'
- Emitir evento SSE para operadores da empresa: `{ type: 'registration_request', data: { id, full_name, phone, requested_role } }`
- Retornar `{ ok: true, message: "Cadastro enviado — aguardando aprovacao" }`

**GET /api/registration/pending** — requireRole('operator', 'super_admin'). Listar registration_requests da empresa com status 'pending'. Retornar array de solicitacoes.

**POST /api/registration/:id/approve** — requireRole('operator', 'super_admin'). Aprovar cadastro conforme OSD132:
1. Buscar registration_request por id, validar que pertence a empresa
2. Criar usuario no Supabase Auth via `supabase.auth.admin.createUser({ email_or_phone, app_metadata: { company_id, role } })`
3. Criar profile na tabela profiles (full_name, phone, company_id, role)
4. Se role = courier, criar entrada em couriers (com extra_data: vehicle_type, plate)
5. Se role = shop, criar entrada em shops (com extra_data: trade_name)
6. Atualizar registration_request: status = 'approved', reviewed_at = now(), reviewed_by = user.id
7. Retornar `{ ok: true }`

**POST /api/registration/:id/reject** — requireRole('operator', 'super_admin'). Rejeitar cadastro:
1. Atualizar registration_request: status = 'rejected', reviewed_at = now(), reviewed_by = user.id
2. Retornar `{ ok: true }`

### 2. Backend — Zod schemas

Em `packages/shared/schemas/src/registration.ts`:
- `RegistrationRequestSchema`: company_id (uuid), full_name (min 2), phone (min 10), email (optional), requested_role (enum courier/shop), extra_data (object optional)
- Exportar do index.ts

### 3. Frontend — Tela de cadastro no app Motoboy

Conforme US005:

**Localizacao:** `apps/motoboy/src/pages/CadastroPage.tsx`

- Acessivel via link "Criar conta" na LoginPage
- Formulario: nome completo, telefone, tipo de veiculo (select)
- company_id: pode ser passado via URL param ou configuracao fixa do app (se o app e white-label por empresa)
- Ao submeter: POST /api/registration/request com requested_role = 'courier'
- Feedback: tela de sucesso "Cadastro enviado! Aguardando aprovacao do operador"
- Link "Voltar para login"

### 4. Frontend — Tela de cadastro no app Lojista

Conforme US025:

**Localizacao:** `apps/lojista/src/pages/CadastroPage.tsx`

- Acessivel via link "Criar conta" na LoginPage
- Formulario: nome completo, email, telefone, nome da loja
- Ao submeter: POST /api/registration/request com requested_role = 'shop'
- Mesmo feedback de sucesso

### 5. Frontend — Aprovacao na Central

Conforme US050, OSD132, OSD133:

Integrar na UsuariosPage (PRP-009) ou criar secao dedicada:

- Badge/notificacao visual no sidebar indicando quantidade de cadastros pendentes (OSD133)
- Secao ou tab "Pendentes" na UsuariosPage mostrando registration_requests pendentes
- Cada item: nome, telefone, role solicitado, data da solicitacao, dados extras
- Botoes "Aprovar" e "Rejeitar" com dialog de confirmacao
- Apos aprovacao, o usuario aparece na lista de usuarios

### 6. Frontend — Hooks

Em `apps/central/src/hooks/useRegistration.ts`:
- `usePendingRegistrations()` — useQuery para GET /api/registration/pending
- `useApproveRegistration()` — useMutation para POST /api/registration/:id/approve
- `useRejectRegistration()` — useMutation para POST /api/registration/:id/reject

Em apps Motoboy e Lojista:
- `useRegister()` — useMutation para POST /api/registration/request

### 7. Frontend — Rotas

Adicionar rota `/cadastro` nos apps Motoboy e Lojista (publica, fora do layout autenticado).

## Limites

- NAO implementar verificacao de telefone via OTP no cadastro — a verificacao acontece no primeiro login apos aprovacao
- NAO implementar notificacao via push/WhatsApp ao solicitante quando aprovado — apenas o operador e notificado via SSE. O solicitante tenta logar e consegue se aprovado
- NAO modificar o endpoint POST /api/auth/invite existente — o self-registration e um mecanismo paralelo
- NAO implementar edicao de registration_request apos envio — submeter nova se necessario
- NAO implementar mecanismo de descoberta de empresa (listar empresas disponiveis) — o company_id deve ser fornecido via URL param, QR code ou configuracao do app
