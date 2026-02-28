---
status: current
---

# PRP-002 — Backend API + Auth + SSE

Implementar o backend completo do Chega.la Wave 1: API REST com Hono + @hono/zod-openapi, autenticacao via GoTrue/JWT, middleware de multi-tenancy, todos os endpoints CRUD e o backbone SSE para eventos em tempo real.

## Objetivo

Produzir o backend funcional em `apps/backbone/` com todas as rotas REST, middlewares de autenticacao e multi-tenancy, logica de negocio (services), e infraestrutura SSE com canais tipados — pronto para ser consumido pelos tres frontends.

## Execution Mode

`implementar`

## Contexto

- **PRP-001 ja executado** — monorepo configurado, Zod schemas em `packages/shared/schemas/`, Drizzle schema em `apps/backbone/db/schema/`, migrations aplicadas, PostgreSQL rodando via Supabase Docker.
- **GoTrue disponivel** — Supabase self-hosted roda GoTrue na porta `${PREFIX}08` (Kong). Client `@supabase/supabase-js` disponivel. JWT contem `sub` (user_id) e metadata customizada (`company_id`, `role`).
- **Specs de referencia** — rotas em `.projeto/wave-1/specs/chegala-design.md` secao "REST — Acoes". Requisitos em `.projeto/wave-1/specs/chegala-requirements.md`. User stories em `.projeto/wave-1/specs/chegala-user-stories.md`.
- **Zod schemas prontos** — todos os schemas de entidade, API request/response e eventos SSE estao em `packages/shared/schemas/`.
- **Drizzle ORM configurado** — schema e migrations em `apps/backbone/db/`. Usar Drizzle para todas as queries.

## Especificacao

### 1. Estrutura do Backbone

```
apps/backbone/src/
  index.ts              <- entrada, Hono app, monta rotas
  middleware/
    auth.ts             <- validacao JWT, extrai user context
    company.ts          <- injeta company_id, filtra queries
    error-handler.ts    <- tratamento padrao de erros
  routes/
    health.ts           <- GET /api/health
    auth.ts             <- POST /api/auth/login, POST /api/auth/invite
    companies.ts        <- CRUD empresa
    orders.ts           <- CRUD pedidos + status transitions
    deliveries.ts       <- assign, accept, reject
    couriers.ts         <- CRUD motoboys + status + location
    shops.ts            <- CRUD lojistas
  services/
    order.service.ts    <- logica de pedidos (validacao de transicoes, numero sequencial)
    delivery.service.ts <- logica de entregas (assign, accept, reject, timeline)
    courier.service.ts  <- logica de motoboys (status, location)
    sse.service.ts      <- gerenciador de canais SSE
  sse/
    manager.ts          <- SSEManager: registro de clients, broadcast por canal
    channels.ts         <- definicao de canais: company/{id}, courier/{id}, order/{id}
```

### 2. Middlewares

**Auth middleware** (OSD001-OSD003, OSD005, RNF004):
- Extrai JWT do header `Authorization: Bearer {token}`
- Valida JWT via chave publica do GoTrue (JWKS ou secret compartilhado)
- Extrai `user_id`, `company_id`, `role` do JWT claims
- Injeta contexto no Hono `c.set('user', { id, companyId, role })`
- Retorna 401 se JWT invalido ou ausente

**Company middleware** (OSD008, RNF005):
- Le `company_id` do contexto do usuario
- Todas as queries devem filtrar por `company_id` — isolamento obrigatorio
- Retorna 403 se tentar acessar dados de outra empresa

### 3. Rotas REST

Todas as rotas usam `@hono/zod-openapi` para:
- Validar request body/params com schemas Zod de `packages/shared/schemas/api/`
- Gerar OpenAPI spec automaticamente (RNF007)
- Retornar tipos tipados

| Metodo | Rota | Descricao | Requisitos |
|--------|------|-----------|------------|
| GET | /api/health | Health check (sem auth) | — |
| POST | /api/auth/invite | Convite por email | OSD006 |
| POST | /api/companies | Criar empresa | OSD020 |
| PATCH | /api/companies/:id | Atualizar empresa | OSD020, OSD021 |
| GET | /api/orders | Listar pedidos (filtro: status, shop_id) | OSD048 |
| GET | /api/orders/:id | Detalhes do pedido | OSD048 |
| POST | /api/orders | Criar pedido | OSD040, OSD041, OSD046, OSD047, OSD049 |
| PATCH | /api/orders/:id/status | Atualizar status | OSD041, OSD042, OSD043 |
| DELETE | /api/orders/:id | Cancelar pedido | OSD044 |
| POST | /api/orders/:id/assign | Atribuir motoboy | OSD060 |
| POST | /api/deliveries/:id/accept | Aceitar entrega | OSD061 |
| POST | /api/deliveries/:id/reject | Recusar entrega | OSD061 |
| GET | /api/couriers | Listar motoboys | OSD083 |
| POST | /api/couriers | Cadastrar motoboy | OSD080 |
| PATCH | /api/couriers/:id/status | Alterar status | OSD081 |
| POST | /api/couriers/:id/location | Enviar localizacao | OSD062, OSD082 |
| PATCH | /api/couriers/:id | Ativar/desativar | OSD086 |
| GET | /api/shops | Listar lojistas | — |
| POST | /api/shops | Cadastrar lojista | OSD100 |

### 4. Logica de Negocio (Services)

**OrderService:**
- Validar transicoes de status conforme maquina de estados: pending → assigned → picked_up → in_transit → delivered. Cancelamento permitido antes de picked_up (OSD043, OSD044)
- Gerar numero sequencial por empresa via query `MAX(order_number) + 1` com lock (OSD046). O trigger no banco e fallback.
- Registrar `created_by` com user_id do contexto (OSD049)
- Registrar timestamp de cada transicao (OSD042)
- Emitir evento SSE apos cada transicao (OSD045)

**DeliveryService:**
- Criar delivery ao atribuir motoboy (OSD060)
- Aceitar: mudar status para `accepted`, notificar empresa via SSE (OSD061)
- Recusar: notificar empresa para reatribuir (OSD061)
- Registrar eventos na tabela `delivery_events` para timeline (OSD065)
- Calcular duracao real (picked_up_at → delivered_at) ao entregar (OSD064)

**CourierService:**
- Alterar status: available ↔ offline manualmente, busy automaticamente quando tem entrega ativa (OSD081)
- Registrar localizacao: inserir em `courier_locations`, emitir evento SSE no canal da empresa e do pedido ativo (OSD062, OSD082, OSD122)
- Frequencia de localizacao: aceitar qualquer frequencia do client, o client controla 30s (disponivel) vs 15s (em entrega)

### 5. SSE Backbone

Implementar SSEManager conforme `.projeto/wave-1/specs/chegala-design.md` secao "SSE — Sincronizacao" e `.projeto/wave-1/specs/chegala-requirements.md` secao "Real-Time e SSE":

**Canais** (OSD120):
- `/events/company/{companyId}` — Central recebe: order_created, order_status, courier_location, courier_status
- `/events/courier/{courierId}` — Motoboy recebe: delivery_assigned, delivery_cancelled
- `/events/order/{orderId}` — Lojista recebe (por pedido): order_status, courier_location

**Implementacao:**
- SSEManager mantem Map de clients por canal
- Rota GET para cada canal que retorna `text/event-stream`
- Autenticacao via JWT (query param `?token=` ou header) (OSD125)
- Heartbeat a cada 30 segundos (OSD126)
- Eventos tipados com schemas Zod de `packages/shared/schemas/events/` (OSD121)
- `data:` serializado como JSON com campo `type` discriminador

**Integracao com services:**
- Cada service chama `sseManager.broadcast(channel, event)` apos mutacoes
- OrderService → company channel + order channel
- DeliveryService → company channel + courier channel + order channel
- CourierService (location) → company channel + order channel (se entrega ativa)

### 6. OpenAPI

Gerar spec OpenAPI automaticamente via `@hono/zod-openapi` (RNF007). Disponibilizar em GET `/api/doc`.

### 7. Performance

- Respostas REST em menos de 200ms p95 (RNF001)
- Eventos SSE com latencia < 500ms apos fato gerador (RNF002)
- Usar connection pooling do Drizzle

## Limites

- **Nao implementar frontend** — este PRP cobre apenas `apps/backbone/`.
- **Nao alterar schemas Zod** em `packages/shared/schemas/` — se necessario ajustar, fazer com retrocompatibilidade.
- **Nao alterar schema Drizzle nem migrations** — usar o que foi criado no PRP-001. Se encontrar erro no schema, documentar e ajustar minimamente.
- **Nao implementar login direto** — o login e feito pelo client via `@supabase/supabase-js` direto com GoTrue. O backend apenas valida JWT.
- **Nao implementar upload de logo** — Supabase Storage sera integrado em wave futura.
- **Nao implementar notificacoes push** — usar apenas SSE para notificacoes em tempo real.
- **Nao criar testes** — testes serao adicionados em waves futuras.
- **Nao usar polling** — toda sincronizacao e via SSE (RNF — decisao arquitetural vinculante).
