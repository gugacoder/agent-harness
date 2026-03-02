---
status: current
wave: 4
session: wave-4--cc
---

# PRP-010 — Super Admin (Backend + Central UI)

## Objetivo

Implementar as rotas de administracao de empresas (/api/admin/*) exclusivas para super_admin e a interface de admin na Central com dashboard, lista de empresas, criacao, ativacao/desativacao e impersonacao.

## Execution Mode

`implementar`

## Contexto

O PRP-001 adicionara o valor 'super_admin' ao enum user_role. O PRP-002 implementara requireRole e o bypass de companyMiddleware para super_admin (incluindo header X-Impersonate-Company).

A tabela companies ja existe em `apps/backbone/db/schema/companies.ts` com campos id, name, cnpj, phone, email, address, lat, lng, logo_url, status (active/suspended), timestamps. O endpoint POST /api/companies e PATCH /api/companies/:id existem em `apps/backbone/src/routes/companies.ts`.

A Central usa React Router v7. A sidebar/nav e definida no layout principal. O design especifica que a area de super admin deve ter navegacao e sidebar proprias (OSD027), isoladas do contexto de empresa.

O Supabase admin client esta em `apps/backbone/src/lib/supabase.ts`.

## Especificacao

### 1. Backend — Criar `apps/backbone/src/routes/admin.ts`

Conforme OSD022-OSD026 e matriz de permissoes:

**GET /api/admin/companies** — requireRole('super_admin'). Lista todas as empresas com contagens agregadas:
- Para cada empresa: id, name, cnpj, status, created_at
- Contagens: total_users (count profiles), total_deliveries (count deliveries), total_orders (count orders)
- Parametros query: status (active/suspended), search (nome ou CNPJ)
- Retorna `{ companies: [...] }`

**POST /api/admin/companies** — requireRole('super_admin'). Criar nova empresa conforme OSD023. Campos: name, cnpj, phone, email, address. Validar CNPJ unico. Criar company com status 'active'. Criar company_configs default. Retorna `{ company: {...} }`.

**PATCH /api/admin/companies/:id** — requireRole('super_admin'). Atualizar dados da empresa ou alterar status conforme OSD024. Campos: name, phone, email, address, status (active/suspended). Retorna `{ company: {...} }`.

**GET /api/admin/metrics** — requireRole('super_admin'). Retornar metricas globais conforme OSD025:
- total_companies (ativas)
- total_deliveries (hoje, semana, mes)
- total_users (ativos)
- deliveries_per_day (array com ultimos 30 dias: { date, count })

### 2. Backend — Zod schemas

Em `packages/shared/schemas/src/admin.ts`:
- `CreateCompanySchema`: name (string min 2), cnpj (string), phone, email, address
- `UpdateCompanySchema`: campos opcionais + status
- `ListCompaniesQuerySchema`: status, search
- Exportar do index.ts

### 3. Frontend — Layout de Admin

Conforme OSD027:

Criar layout separado para area de super admin. Quando o usuario logado tem role = super_admin e nao esta impersonando, exibir sidebar/nav de admin com itens:
- Dashboard (metricas globais)
- Empresas (lista)

Quando impersonando uma empresa, a interface muda para o layout normal da Central (como se fosse operador daquela empresa), com badge visivel "Impersonando: {nome}" e botao "Voltar para admin".

### 4. Frontend — AdminDashboard

**Localizacao:** `apps/central/src/pages/AdminDashboard.tsx`

Conforme US074, OSD025:
- Cards de metricas: total empresas ativas, total entregas (hoje/semana/mes), total usuarios ativos
- Grafico de entregas por dia (ultimos 30 dias) usando componente de chart existente (se houver) ou chart simples com SVG/canvas
- Os dados vem de GET /api/admin/metrics

### 5. Frontend — AdminEmpresasPage

**Localizacao:** `apps/central/src/pages/AdminEmpresasPage.tsx`

Conforme US070-US073:
- Lista de empresas: nome, CNPJ, status badge (verde/vermelho), total usuarios, total entregas (US070)
- Filtro por status e busca por nome/CNPJ
- Botao "Nova Empresa" — dialog com formulario (US071)
- Menu de acoes por empresa: "Suspender"/"Reativar" com confirmacao (US072), "Entrar como" para impersonar (US073)

### 6. Frontend — Impersonacao

Conforme US073, OSD026:
- Ao clicar "Entrar como", armazenar o company_id no state da aplicacao (ex: Context ou URL param)
- Setar header `X-Impersonate-Company: {companyId}` em todas as chamadas HTTP subsequentes (configurar no Ky instance)
- Navegar para a home normal da Central (que agora mostra dados da empresa impersonada)
- Exibir badge fixo (top bar) indicando impersonacao com botao "Voltar para admin"
- Ao voltar, limpar o header e navegar de volta para o layout admin

### 7. Frontend — Hooks

Em `apps/central/src/hooks/useAdmin.ts`:
- `useAdminCompanies(filters)` — useQuery para GET /api/admin/companies
- `useCreateCompany()` — useMutation para POST /api/admin/companies
- `useUpdateCompany()` — useMutation para PATCH /api/admin/companies/:id
- `useAdminMetrics()` — useQuery para GET /api/admin/metrics
- `useImpersonate()` — gerencia state de impersonacao (companyId, header HTTP, toggle)

### 8. Frontend — Roteamento

Adicionar rotas condicionais no App.tsx da Central:
- Se role = super_admin e nao impersonando: renderizar layout admin com rotas /admin/dashboard, /admin/empresas
- Se role = super_admin e impersonando: renderizar layout normal da Central
- Se role != super_admin: rotas normais (sem acesso a /admin/*)

## Limites

- NAO criar app separado para super admin — integrar na Central com layout condicional
- NAO modificar rotas existentes de companies.ts — as rotas de admin sao separadas em admin.ts
- NAO implementar CRUD completo de usuarios por empresa no admin — isso e PRP-009. O admin ve empresas, nao usuarios individuais
- NAO implementar logs de auditoria — escopo futuro
- NAO alterar GoTrue config — usar Supabase Admin API para operacoes
