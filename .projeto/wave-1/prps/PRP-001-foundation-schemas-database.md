---
status: current
---

# PRP-001 — Foundation, Schemas e Database

Scaffold do monorepo, schemas Zod compartilhados (source of truth) e schema de banco Drizzle com migrations para o nucleo operacional do Chega.la Wave 1.

## Objetivo

Produzir a fundacao tecnica do projeto: estrutura de monorepo com npm workspaces, schemas Zod em `packages/shared/schemas/`, schema Drizzle em `apps/backbone/db/schema/`, e migrations prontas para rodar contra PostgreSQL via Supabase self-hosted.

## Execution Mode

`implementar`

## Contexto

- **Projeto greenfield** — `apps/` contem apenas `.gitkeep` e `packages/` vazio. Nenhum codigo existente.
- **Plataforma ja existe** — `docker-compose.platform.yml` sobe Supabase self-hosted (PostgreSQL, GoTrue, Kong, Studio). Dev ports configuradas via PREFIX env var (worktree usa PREFIX=21, parent usa PREFIX=20). Arquivo `.env` ja tem credenciais.
- **Stack decidida** — Hono + @hono/zod-openapi (API), Drizzle ORM (DB), Zod (schemas), React + Vite (frontends), SSE (real-time). Detalhes completos em `.projeto/wave-1/specs/chegala-design.md`.
- **Modelo de dados definido** — 8 tabelas, 6 enums, 11 indices, triggers. Detalhes em `.projeto/wave-1/specs/chegala-er.md`.
- **Docker Compose** — `docker-compose.yml` na raiz do projeto e o ponto de entrada para servicos do app (backbone, frontends). Deve referenciar a rede do platform compose.
- **Convencoes** — Arquivos kebab-case, componentes PascalCase, tabelas snake_case plural, campos snake_case. Detalhes em `.projeto/wave-1/specs/chegala-design.md` secao "Convencoes de Codigo".

## Especificacao

### 1. Estrutura do Monorepo

Criar a arvore de diretorios conforme `.projeto/wave-1/specs/chegala-design.md` secao "Estrutura do Monorepo":

- `packages/shared/schemas/` — Zod schemas (source of truth)
  - `entities/` — order.ts, courier.ts, shop.ts, delivery.ts, company.ts, profile.ts
  - `api/` — request/response schemas por recurso
  - `events/` — SSE event schemas
- `apps/backbone/` — Hono API (configurar mas nao implementar rotas — escopo do PRP-002)
  - `src/` — ponto de entrada, placeholder
  - `db/schema/` — Drizzle schema
  - `db/migrations/` — migrations geradas
  - `drizzle.config.ts`
- `apps/central/` — placeholder com Vite + React (escopo do PRP-003)
- `apps/lojista/` — placeholder com Vite + React (escopo do PRP-004)
- `apps/motoboy/` — placeholder com Vite + React (escopo do PRP-005)

Configurar npm workspaces no `package.json` raiz. Cada app e package tem seu proprio `package.json` e `tsconfig.json`.

### 2. Schemas Zod (Source of Truth)

Criar schemas Zod para todas as entidades conforme `.projeto/wave-1/specs/chegala-er.md`:

| Arquivo | Entidades | Referencia |
|---------|-----------|------------|
| `entities/company.ts` | CompanySchema, CompanyStatusEnum | er.md §companies |
| `entities/profile.ts` | ProfileSchema, UserRoleEnum | er.md §profiles |
| `entities/shop.ts` | ShopSchema | er.md §shops |
| `entities/courier.ts` | CourierSchema, CourierStatusEnum | er.md §couriers |
| `entities/order.ts` | OrderSchema, OrderStatusEnum | er.md §orders |
| `entities/delivery.ts` | DeliverySchema, DeliveryStatusEnum, DeliveryEventSchema, DeliveryEventTypeEnum | er.md §deliveries, §delivery_events |
| `entities/courier-location.ts` | CourierLocationSchema | er.md §courier_locations |

Criar schemas de API (request/response) para cada recurso conforme `.projeto/wave-1/specs/chegala-design.md` secao "REST — Acoes":

| Arquivo | Schemas |
|---------|---------|
| `api/orders.ts` | CreateOrderRequest, UpdateOrderStatusRequest, AssignCourierRequest |
| `api/couriers.ts` | CreateCourierRequest, UpdateCourierStatusRequest, SendLocationRequest |
| `api/shops.ts` | CreateShopRequest |
| `api/deliveries.ts` | AcceptDeliveryRequest, RejectDeliveryRequest |
| `api/auth.ts` | LoginRequest, LoginResponse, InviteUserRequest |

Criar schemas de eventos SSE conforme `.projeto/wave-1/specs/chegala-design.md` secao "Eventos SSE Tipados":

| Arquivo | Schemas |
|---------|---------|
| `events/order.ts` | OrderCreatedEvent, OrderStatusEvent |
| `events/courier.ts` | CourierLocationEvent, CourierStatusEvent |
| `events/delivery.ts` | DeliveryAssignedEvent, DeliveryStatusEvent |

Cada arquivo exporta schemas nomeados com sufixo `Schema` (ex: `OrderSchema`, `CreateOrderRequestSchema`). Barrel export em `index.ts`.

Requisitos cobertos: RNF006 (Zod em tudo).

### 3. Schema Drizzle

Criar Drizzle schema em `apps/backbone/db/schema/` derivando dos Zod schemas. Usar `drizzle-zod` para manter sincronia.

- Uma tabela por arquivo, nomeacao snake_case plural
- Tipos conforme `.projeto/wave-1/specs/chegala-er.md`: UUID PKs (`gen_random_uuid()`), `timestamptz` para datas, `numeric(10,7)` para coordenadas
- Todos os enums como `pgEnum`
- Foreign keys com `ON DELETE CASCADE` para profiles → auth.users, demais com `ON DELETE RESTRICT`
- `created_at` e `updated_at` com defaults (`NOW()`)

Requisitos cobertos: RNF008, RNF009.

### 4. Migrations

Gerar migrations via `drizzle-kit generate`. Criar script npm `db:generate` e `db:migrate`.

Apos gerar, adicionar manualmente ao SQL de migration:
- Indices conforme `.projeto/wave-1/specs/chegala-er.md` secao "Indices Recomendados" (11 indices)
- Triggers conforme `.projeto/wave-1/specs/chegala-er.md` secao "Triggers" (`update_updated_at`, `generate_order_number`)

### 5. Docker Compose (app services)

Atualizar `docker-compose.yml` para incluir:
- Service `backbone` — Hono API rodando na porta `${PREFIX}01`
- Variavel de conexao ao PostgreSQL da plataforma (porta `${PREFIX}32`)
- Network conectando ao platform compose

Os frontends (central, lojista, motoboy) serao adicionados nos respectivos PRPs.

### 6. Config base dos frontends (placeholder)

Cada frontend (`apps/central`, `apps/lojista`, `apps/motoboy`) deve ter:
- `package.json` com dependencias: react, react-dom, vite, @vitejs/plugin-react, typescript
- `vite.config.ts` com porta conforme `.projeto/wave-1/specs/chegala-design.md` secao "Portas (Dev)": central=${PREFIX}02, lojista=${PREFIX}03, motoboy=${PREFIX}04
- `tsconfig.json` referenciando `packages/shared`
- `index.html` + `src/main.tsx` minimo (App com "Chega.la — {modulo}")
- **Nao implementar rotas, componentes ou funcionalidades** — isso e escopo dos PRPs 003-005

### 7. Scripts npm

Adicionar scripts no `package.json` raiz:

| Script | Funcao |
|--------|--------|
| `dev:backbone` | Rodar backbone em dev mode |
| `dev:central` | Rodar central em dev mode |
| `dev:lojista` | Rodar lojista em dev mode |
| `dev:motoboy` | Rodar motoboy em dev mode |
| `db:generate` | Gerar migrations Drizzle |
| `db:migrate` | Aplicar migrations |
| `build` | Build de todos os packages e apps |

## Limites

- **Nao implementar rotas de API** — apenas scaffold do Hono com um health check `/api/health`. Rotas sao escopo do PRP-002.
- **Nao implementar funcionalidades nos frontends** — apenas placeholder com texto. Funcionalidades sao escopo dos PRPs 003-005.
- **Nao alterar `docker-compose.platform.yml`** — este arquivo e gerenciado separadamente.
- **Nao instalar shadcn/ui, Tailwind, Leaflet ou react-router nos frontends** — sera feito nos PRPs de cada frontend.
- **Nao criar tabelas no schema auth** — o Supabase GoTrue gerencia `auth.users` automaticamente.
- **Nao usar `pgSchema('auth')` no Drizzle** — referenciar `auth.users` via SQL raw nas FKs se necessario.
- **Nao criar arquivos de teste** — testes serao adicionados em waves futuras.
