---
status: finished
finished_at: 2026-03-02T23:45:00Z
wave: 6
depends_on: []
---

# PRP-001 — Infraestrutura de Onboarding (DB + API + Schemas)

## Objetivo

Criar a camada de persistencia e API para rastreamento de progresso de onboarding. Inclui: schema Drizzle, migration, endpoints REST no backbone e schemas Zod compartilhados.

## Execution Mode

`implementar`

## Contexto

### Estado atual do banco

Duas migrations existem em `apps/backbone/db/migrations/` (0000 e 0001). Padroes estabelecidos:
- UUID PKs via `gen_random_uuid()`
- TIMESTAMPTZ com `DEFAULT now()`
- Enums PostgreSQL via `pgEnum` no Drizzle
- FKs com `onDelete: "restrict"` ou `"cascade"` conforme caso
- Triggers `update_updated_at()` para tabelas com `updated_at`
- Indices explicitamente criados na migration

### Schema Drizzle existente

Tabelas definidas em `apps/backbone/db/schema/` com exports em `index.ts`. Enums centralizados em `_enums.ts`. Pattern: `pgTable("nome", { ... })` com tipos importados de `drizzle-orm/pg-core`.

### Schemas Zod compartilhados

Em `packages/shared/schemas/`. Estrutura: `entities/` (schemas de entidade) e `api/` (request/response). Cada entidade tem enum Zod, schema e type export. Requests usam `.optional()` para campos opcionais.

### Backbone API

Hono com OpenAPI (`@hono/zod-openapi`). Routes usam `createRoute()` + `router.openapi()`. Middleware chain: `auth` → `company` → handler. Services em `src/services/`. Contexto via `c.get("user")` e `c.get("companyId")`.

## Especificacao

### 1. Enum Drizzle

Adicionar em `apps/backbone/db/schema/_enums.ts`:

```
onboardingFlowEnum = pgEnum("onboarding_flow", ["wizard", "tutorial", "guided_overlay"])
```

### 2. Tabela Drizzle

Criar `apps/backbone/db/schema/onboarding.ts`:

| Campo | Tipo Drizzle | Constraints |
|-------|-------------|-------------|
| id | uuid | PK, defaultRandom() |
| profile_id | uuid | FK → profiles.id, onDelete: "cascade", notNull |
| flow | onboardingFlowEnum | notNull |
| step_key | text | notNull |
| metadata | jsonb | nullable |
| completed_at | timestamp (withTimezone, mode: "string") | notNull |
| created_at | timestamp (withTimezone, mode: "string") | notNull, defaultNow() |

Exportar em `db/schema/index.ts`.

### 3. Migration

Gerar via `npm run db:generate`. A migration deve incluir:
- CREATE TYPE onboarding_flow
- CREATE TABLE onboarding_progress
- FK para profiles
- INDEX `idx_onboarding_profile_flow` em (profile_id, flow)
- UNIQUE INDEX `idx_onboarding_unique_step` em (profile_id, flow, step_key)

Conforme `chegala-er.md` secao "Migration SQL".

### 4. Schemas Zod compartilhados

Criar `packages/shared/schemas/entities/onboarding.ts`:

| Export | Tipo | Descricao |
|--------|------|-----------|
| OnboardingFlowEnum | z.enum | ["wizard", "tutorial", "guided_overlay"] |
| OnboardingStepSchema | z.object | Schema completo da entidade |
| OnboardingStep | type | z.infer |

Criar `packages/shared/schemas/api/onboarding.ts`:

| Export | Tipo | Descricao |
|--------|------|-----------|
| GetOnboardingProgressQuerySchema | z.object | { flow?: OnboardingFlowEnum } |
| CompleteOnboardingStepRequestSchema | z.object | { flow, step_key, metadata? } |
| OnboardingProgressResponseSchema | z.array | Array de OnboardingStepSchema |

Exportar em `packages/shared/schemas/index.ts`.

### 5. Service layer

Criar `apps/backbone/src/services/onboarding.service.ts` com 3 funcoes:

| Funcao | Parametros | Retorno | Descricao |
|--------|-----------|---------|-----------|
| getOnboardingProgress | profileId, flow? | OnboardingStep[] | Lista steps completados. Filtra por flow se informado |
| completeOnboardingStep | profileId, { flow, step_key, metadata? } | OnboardingStep | Insere step. Usa ON CONFLICT DO NOTHING para idempotencia |
| resetOnboardingProgress | profileId, flow | void | Deleta todos os steps de um fluxo para o perfil |

### 6. Rotas API

Criar `apps/backbone/src/routes/onboarding.ts`:

| Metodo | Path | Auth | Descricao | Request | Response |
|--------|------|------|-----------|---------|----------|
| GET | /onboarding/progress | auth + company | Lista steps do usuario autenticado | query: { flow? } | 200: OnboardingStep[] |
| POST | /onboarding/progress | auth + company | Registra step completado | body: { flow, step_key, metadata? } | 201: OnboardingStep |
| DELETE | /onboarding/progress | auth + company | Reseta fluxo | query: { flow } | 204: no content |

O handler deve extrair `profileId` de `c.get("user").id` (o `profiles.id` corresponde ao `auth.users.id`).

Registrar router em `apps/backbone/src/index.ts` com `.route("/onboarding", onboardingRouter)`.

## Limites

- NAO criar logica de UI. Este PRP e apenas backend + schemas.
- NAO alterar tabelas existentes. Apenas criar nova tabela.
- NAO adicionar campo de `updated_at` na tabela onboarding_progress. Steps sao imutaveis apos criacao.
- NAO criar endpoints de listagem admin. Apenas endpoints para o usuario autenticado consultar/modificar seu proprio progresso.
- NAO usar `onDelete: "restrict"` na FK para profiles. Usar `"cascade"` — se perfil e deletado, progresso vai junto.
- A funcao `completeOnboardingStep` deve ser idempotente. Se o step ja existe, retorna o existente sem erro.
- O DELETE so aceita o parametro `flow` como obrigatorio. Nao permitir delete sem flow (evitar apagar tudo por acidente).
