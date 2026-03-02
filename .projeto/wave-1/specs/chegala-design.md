# Chega.la - Design e Arquitetura Wave 1

Arquitetura e decisoes tecnicas para a Wave 1 do Chega.la — tres modulos PWA sincronizados em tempo real via backbone SSE.

---

## Stack Principal

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| API/Backend | Hono + @hono/zod-openapi | Leve, rapido, SSE nativo, OpenAPI gerado automaticamente |
| ORM | Drizzle | TypeScript-first, schema no repo, migrations derivadas |
| Banco | PostgreSQL 15 (Supabase Docker) | Battle-tested para apps transacionais, multi-tenancy |
| Auth | GoTrue (Supabase self-hosted) | JWT pronto, @supabase/supabase-js nos clients |
| Storage | Supabase Storage | Upload de fotos (motoboy), integrado ao compose |
| Real-time | SSE nativo (Hono) | Unidirecional server→client, sem polling, nativo no browser |
| Schemas | Zod (packages/shared/) | Source of truth de todos os contratos |
| Frontend | React + Vite | Popular, rapido, PWA nativo, IA conhece profundamente |
| UI | shadcn/ui + Tailwind CSS | Componentes prontos, tokens semanticos, acessivel |
| Mapas | Leaflet + OpenStreetMap | Open source, sem custo de API, leve |
| Forms | React Hook Form + Zod | Validacao compartilhada com backend |

---

## Estrutura do Monorepo

```
apps/
  backbone/               <- Hono + Drizzle + SSE (API REST + real-time)
    src/
      routes/             <- rotas @hono/zod-openapi
      services/           <- logica de negocio
      sse/                <- gerenciador de canais SSE
    db/
      schema/             <- Drizzle schema (TypeScript)
      migrations/         <- migrations geradas
    drizzle.config.ts
  central/                <- Central da Empresa (React + Vite PWA)
    src/
      pages/              <- paginas por rota
      components/         <- componentes compartilhados
      hooks/              <- hooks customizados
      lib/                <- api client, SSE client, utils
  lojista/                <- App do Lojista (React + Vite PWA)
    src/
      pages/
      components/
      hooks/
      lib/
  motoboy/                <- App do Motoboy (React + Vite PWA)
    src/
      pages/
      components/
      hooks/
      lib/

packages/
  shared/
    schemas/              <- Zod schemas (source of truth)
      entities/           <- order.ts, courier.ts, shop.ts, delivery.ts, company.ts
      api/                <- request/response schemas por recurso
      events/             <- SSE event schemas
```

---

## Piramide de Derivacao

```
Zod Schemas (packages/shared/schemas/)
|
|  <- SOURCE OF TRUTH
|
|-->  Drizzle Schema (apps/backbone/db/schema/)
|       TypeScript -> migrations -> PostgreSQL
|
|-->  OpenAPI Spec (gerada pelo @hono/zod-openapi)
|       rotas tipadas -> documentacao -> validacao
|
|-->  SSE Event Types (packages/shared/schemas/events/)
|       eventos tipados -> pub/sub -> clients subscrevem
|
|-->  Frontend Forms (apps/*/components/)
        validacao client-side com os mesmos schemas
```

---

## Comunicacao

### REST — Acoes

Todas as acoes (criar, atualizar, deletar) vao por REST com schemas Zod validados.

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | /api/orders | Criar pedido |
| PATCH | /api/orders/:id/status | Atualizar status do pedido |
| POST | /api/orders/:id/assign | Atribuir motoboy a pedido |
| GET | /api/orders | Listar pedidos (filtros: status, shop_id) |
| GET | /api/orders/:id | Detalhes do pedido |
| POST | /api/couriers | Cadastrar motoboy |
| PATCH | /api/couriers/:id/status | Alterar status do motoboy |
| POST | /api/couriers/:id/location | Enviar localizacao GPS |
| GET | /api/couriers | Listar motoboys |
| POST | /api/shops | Cadastrar lojista |
| GET | /api/shops | Listar lojistas |
| POST | /api/deliveries/:id/accept | Motoboy aceita entrega |
| POST | /api/deliveries/:id/reject | Motoboy recusa entrega |

### SSE — Sincronizacao

Eventos unidirecionais server→client. Nenhum app faz polling.

| Canal | Subscriber | Eventos |
|-------|-----------|---------|
| /events/company/{companyId} | Central da Empresa | order_created, order_status, courier_location, courier_status |
| /events/courier/{courierId} | App do Motoboy | delivery_assigned, delivery_cancelled |
| /events/order/{orderId} | App do Lojista (por pedido) | order_status, courier_location |

### Eventos SSE Tipados

```typescript
// packages/shared/schemas/events/

OrderCreatedEvent = { type: 'order_created', orderId, orderNumber, shopName }
OrderStatusEvent = { type: 'order_status', orderId, status, timestamp }
CourierLocationEvent = { type: 'courier_location', courierId, lat, lng, timestamp }
CourierStatusEvent = { type: 'courier_status', courierId, status }
DeliveryAssignedEvent = { type: 'delivery_assigned', deliveryId, orderId, pickupAddress, deliveryAddress }
DeliveryStatusEvent = { type: 'delivery_status', deliveryId, status, timestamp }
```

---

## Autenticacao

1. Usuario entra email/senha no app
2. GoTrue valida credenciais e retorna JWT
3. JWT incluido em toda requisicao REST (Authorization: Bearer)
4. Conexoes SSE autenticadas via JWT no query param ou header
5. Backend valida JWT e extrai company_id + role do usuario
6. Todas as queries filtram por company_id (multi-tenancy)

---

## Fluxo Principal — Ciclo de Pedido

```
Lojista                    Central                     Motoboy
   |                          |                           |
   |-- POST /orders --------->|                           |
   |                          |-- SSE: order_created ---->|
   |                          |                           |
   |                          |-- POST /orders/:id/assign |
   |                          |                           |
   |                          |-- SSE: delivery_assigned ->|
   |<-- SSE: order_status ----|                           |
   |                          |                           |
   |                          |            POST /deliveries/:id/accept
   |<-- SSE: order_status ----|<-- SSE: order_status -----|
   |                          |                           |
   |                          |            PATCH /orders/:id/status (picked_up)
   |<-- SSE: order_status ----|<-- SSE: order_status -----|
   |<-- SSE: courier_location |<-- POST /couriers/:id/location (15s)
   |                          |                           |
   |                          |            PATCH /orders/:id/status (delivered)
   |<-- SSE: order_status ----|<-- SSE: order_status -----|
```

---

## Bibliotecas

| Funcao | Biblioteca | Versao |
|--------|------------|--------|
| API framework | hono | ^4 |
| OpenAPI | @hono/zod-openapi | ^0.18 |
| ORM | drizzle-orm | ^0.36 |
| Drizzle Zod | drizzle-zod | ^0.7 |
| Schemas | zod | ^3.25 |
| Auth client | @supabase/supabase-js | ^2 |
| React | react | ^19 |
| Build | vite | ^6 |
| PWA | vite-plugin-pwa | ^0.21 |
| UI components | shadcn/ui (v4) | latest |
| CSS | tailwindcss | ^4 |
| Forms | react-hook-form | ^7 |
| Form resolver | @hookform/resolvers | ^3 |
| Mapas | react-leaflet | ^5 |
| Router | react-router | ^7 |
| Estado server | @tanstack/react-query | ^5 |
| HTTP client | ky | ^1 |

---

## Convencoes de Codigo

| Item | Convencao | Exemplo |
|------|-----------|---------|
| Arquivos | kebab-case | `order-list.tsx` |
| Componentes | PascalCase | `OrderList` |
| Hooks | camelCase com use | `useOrders` |
| Schemas Zod | PascalCase + Schema | `OrderSchema` |
| Tabelas SQL | snake_case plural | `orders`, `courier_locations` |
| Campos SQL | snake_case | `company_id`, `created_at` |
| Rotas API | kebab-case plural | `/api/orders`, `/api/couriers` |
| Eventos SSE | snake_case | `order_status`, `courier_location` |

---

## Portas (Dev)

| Servico | Porta | Variavel |
|---------|-------|----------|
| Caddy (proxy) | ${PREFIX}00 | PUBLIC_PORT |
| Backbone (API) | ${PREFIX}01 | BACKBONE_PORT |
| Central | ${PREFIX}02 | CENTRAL_PORT |
| Lojista | ${PREFIX}03 | LOJISTA_PORT |
| Motoboy | ${PREFIX}04 | MOTOBOY_PORT |
| PostgreSQL | ${PREFIX}32 | POSTGRES_PORT |
| Kong | ${PREFIX}08 | KONG_PORT |
| Studio | ${PREFIX}09 | STUDIO_PORT |

Worktree usa PREFIX=21 (portas 2100-2139), isolado do parent (PREFIX=20).

---

## Branding

| Token | Valor | Uso |
|-------|-------|-----|
| Primary | #222e6e | Background principal, headers, botoes primarios |
| Secondary | #1dace7 | Acentos, links, elementos interativos |
| Accent | #fca322 | Destaques, badges, alertas positivos |
| Logo | SVG (nunca texto generico) | Header de todos os modulos |

---

## Rastreabilidade

| Decisao | Justificativa | Vinculante |
|---------|---------------|------------|
| Zod source of truth | Todos os contratos derivam de Zod | Sim |
| REST para acoes, SSE para sync | Sem polling. Acao → REST, update → SSE | Sim |
| Multi-tenancy por company_id | Isolamento de dados entre empresas | Sim |
| PWA nos 3 modulos | Instalavel, funcional offline (motoboy) | Sim |
| Leaflet para mapas | Open source, sem custo | Sim |
| shadcn/ui v4 | Componentes acessiveis, tokens semanticos | Sim |
| Hono como API | SSE nativo, OpenAPI gerado, leve | Sim |
