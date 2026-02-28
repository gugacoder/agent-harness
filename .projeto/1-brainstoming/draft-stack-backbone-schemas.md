# Stack Técnica: Backbone, Schemas e Contratos

## Premissa

A IA precisa de uma fonte de verdade declarativa no repositório para manter consistência entre 5 sistemas (backbone, app operador, app motoboy, app pedidos, landing page). Sem isso, cada agente infere contratos diferentes a partir do código e a coerência se perde.

Critério de escolha: **quanto mais popular a tecnologia, menos a IA erra**. Maximizar dados de treino do modelo = minimizar erro sem treinamento extra.

## Single Source of Truth: Zod

**Zod** como source of truth de todos os data shapes do sistema:

- Entidades (order, courier, company, customer, delivery, route...)
- Payloads de API (request/response por endpoint)
- Eventos SSE (order_updated, courier_location, delivery_status...)
- Validações de formulário (shared entre frontend e backend)

Tudo TypeScript, tudo no repo, tudo legível pelo agente.

```
packages/shared/schemas/
  ├── entities/
  │   ├── order.ts
  │   ├── courier.ts
  │   ├── company.ts
  │   ├── customer.ts
  │   ├── delivery.ts
  │   └── route.ts
  ├── api/
  │   ├── orders.ts          ← request/response schemas por recurso
  │   ├── couriers.ts
  │   ├── deliveries.ts
  │   └── auth.ts
  └── events/
      ├── order-events.ts    ← SSE event schemas
      ├── courier-events.ts
      └── delivery-events.ts
```

Todos os apps importam de `packages/shared/schemas/`. O motoboy, o operador, o cliente, o backbone — todos falam a mesma língua.

## Banco de Dados: PostgreSQL + Drizzle

**PostgreSQL** — battle-tested para apps transacionais com dados relacionais (pedidos, rotas, tracking, empresas, entregadores).

**Drizzle ORM** — schema definido em TypeScript, alinhado com Zod:

- Schema IS código no repo (não vive só no banco)
- Migrations geradas a partir do schema
- A IA conhece Drizzle profundamente
- Mapeamento direto Drizzle ↔ Zod via `drizzle-zod`

```
apps/backbone/db/
  ├── schema/
  │   ├── orders.ts
  │   ├── couriers.ts
  │   ├── companies.ts
  │   └── deliveries.ts
  └── migrations/
      └── ...
```

### Relação Zod ↔ Drizzle

O Drizzle schema define a estrutura do banco. O Zod schema (em `packages/shared/`) define os contratos de API e validação. `drizzle-zod` faz a ponte:

```ts
// apps/backbone/db/schema/orders.ts
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  status: text('status', { enum: ['pending', 'assigned', 'picked_up', 'delivered', 'cancelled'] }).notNull(),
  // ...
})

// packages/shared/schemas/entities/order.ts
export const OrderSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  status: z.enum(['pending', 'assigned', 'picked_up', 'delivered', 'cancelled']),
  // ...
})
```

Os dois schemas se referenciam mas o Zod é o contrato público (o que os apps veem) e o Drizzle é o contrato privado (o que o banco vê).

## API REST: Hono + OpenAPI

**Hono** como framework do backbone:

- Leve, rápido, muito popular em 2025-2026
- Suporte nativo a SSE (`c.streamSSE()`)
- Integração nativa Zod + OpenAPI via `@hono/zod-openapi`
- Rota = schema + validação + documentação num só lugar
- A IA conhece Hono profundamente

### Definição de Rotas

```ts
import { createRoute, z } from '@hono/zod-openapi'
import { OrderSchema, CreateOrderSchema } from '@shared/schemas/api/orders'

const getOrder = createRoute({
  method: 'get',
  path: '/orders/{id}',
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: OrderSchema } },
      description: 'Order details',
    },
    404: {
      description: 'Order not found',
    },
  },
})

const createOrder = createRoute({
  method: 'post',
  path: '/orders',
  request: {
    body: {
      content: { 'application/json': { schema: CreateOrderSchema } },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: OrderSchema } },
      description: 'Order created',
    },
  },
})
```

### OpenAPI Gerado

O `@hono/zod-openapi` gera a spec OpenAPI automaticamente a partir das rotas. Fica disponível em `/doc` (JSON) e `/swagger` (UI). A IA pode ler a spec gerada para entender todos os endpoints sem navegar código.

## Real-Time: SSE Channels

**SSE (Server-Sent Events)** para comunicação real-time:

- Sem polling (economiza tráfego, crítico para motoboys em 4G)
- Unidirecional server → client (suficiente para notificações e updates)
- Ações do cliente vão por REST; updates voltam por SSE
- Nativo do browser, sem biblioteca extra no client

### Arquitetura de Canais

```
Backbone SSE Channels:
  /events/company/{companyId}     ← operador recebe: novos pedidos, status entregas, posição motoboys
  /events/courier/{courierId}     ← motoboy recebe: novos pedidos atribuídos, mudanças de rota
  /events/order/{orderId}         ← cliente recebe: status do pedido, posição do motoboy
```

### Eventos Tipados com Zod

```ts
// packages/shared/schemas/events/order-events.ts
export const OrderStatusEvent = z.object({
  type: z.literal('order_status'),
  orderId: z.string().uuid(),
  status: z.enum(['pending', 'assigned', 'picked_up', 'delivered', 'cancelled']),
  timestamp: z.string().datetime(),
})

export const CourierLocationEvent = z.object({
  type: z.literal('courier_location'),
  courierId: z.string().uuid(),
  lat: z.number(),
  lng: z.number(),
  timestamp: z.string().datetime(),
})
```

### SSE no Hono

```ts
app.get('/events/company/:companyId', async (c) => {
  return c.streamSSE(async (stream) => {
    const companyId = c.req.param('companyId')
    // subscribe to company channel
    // stream.writeSSE({ event: 'order_status', data: JSON.stringify(event) })
  })
})
```

## Por que NÃO Convex

- Menos mainstream → menos dados de treino → mais erro da IA
- Opinião forte sobre real-time (subscriptions próprias, não SSE)
- Atrito com backbone custom + SSE channels
- Vendor lock-in no banco (não é PostgreSQL standard)

PostgreSQL + Drizzle + Hono + SSE = controle total com stack que a IA conhece profundamente.

## Pirâmide de Derivação

```
Zod Schemas (packages/shared/schemas/)
│
│  ← SOURCE OF TRUTH
│
├──→ Drizzle Schema (apps/backbone/db/)
│      schema TypeScript → migrations → PostgreSQL
│
├──→ OpenAPI Spec (gerada pelo @hono/zod-openapi)
│      rotas tipadas → documentação → validação automática
│
├──→ SSE Event Types (packages/shared/schemas/events/)
│      eventos tipados → pub/sub no backbone → clients subscrevem
│
└──→ Frontend Forms (apps/*/components/)
       validação client-side com os mesmos schemas Zod
```

Tudo deriva do Zod. Um agente em qualquer wave lê `packages/shared/schemas/` e sabe exatamente o contrato de todo o sistema.

## Estrutura do Monorepo

```
apps/
  backbone/           ← Hono + Drizzle + SSE (API REST + real-time)
  operator-app/       ← app do operador (gestão da empresa)
  courier-app/        ← app do motoboy (execução de entregas)
  customer-app/       ← app de pedidos (cliente final)
  landing/            ← landing page de venda

packages/
  shared/
    schemas/          ← Zod schemas (source of truth)
    types/            ← TypeScript types derivados dos schemas
    utils/            ← utilidades compartilhadas
```
