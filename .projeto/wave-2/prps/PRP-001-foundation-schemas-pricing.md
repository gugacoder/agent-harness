---
status: current
---

# PRP-001 — Foundation Wave 2: Schemas, DB e Precificacao

Scaffold dos schemas Zod, schema Drizzle e migrations para as 10 novas tabelas da Wave 2 (precificacao, financeiro, faturamento, POD, configs). Implementar servico de calculo de distancia (Haversine), servico de precificacao automatica e CRUD de tabelas de preco.

## Objetivo

Produzir a fundacao tecnica da Wave 2: schemas Zod em `packages/shared/schemas/`, schema Drizzle em `apps/backbone/db/schema/`, migrations aplicadas, servico de calculo de distancia, servico de precificacao automatica por entrega, e CRUD de tabelas de preco com regras — pronto para ser consumido pelos demais PRPs.

## Execution Mode

`implementar`

## Contexto

- **Wave 1 completa** — monorepo funcional com npm workspaces. Backbone Hono rodando com auth JWT, SSE, CRUD de pedidos/entregas/motoboys/lojistas. 3 frontends React+Vite funcionais. PostgreSQL via Supabase Docker.
- **Schemas Zod existentes** — entidades em `packages/shared/schemas/entities/` (company, courier, courier-location, delivery, order, profile, shop). API schemas em `packages/shared/schemas/api/` (auth, couriers, deliveries, orders, shops). Event schemas em `packages/shared/schemas/events/` (courier, delivery, order). Barrel exports via `index.ts`.
- **Drizzle schema existente** — 10 arquivos em `apps/backbone/db/schema/` (_enums, companies, couriers, courier-locations, deliveries, delivery-events, orders, profiles, shops, index). Enums via `pgEnum`. UUID PKs com `gen_random_uuid()`. `timestamptz` para datas. Barrel export em `index.ts`.
- **Migration existente** — 1 arquivo SQL em `apps/backbone/db/migrations/`. Scripts `db:generate` e `db:migrate` configurados.
- **Backend services existentes** — `courier.service.ts`, `delivery.service.ts`, `order.service.ts` em `apps/backbone/src/services/`. SSE manager em `apps/backbone/src/sse/`.
- **Backend routes existentes** — 8 arquivos em `apps/backbone/src/routes/` (auth, companies, couriers, deliveries, events, health, orders, shops). Padrao `@hono/zod-openapi`.
- **Modelo Wave 2 definido** — 10 novas tabelas, 6 novos enums, indices e triggers detalhados em `.projeto/wave-2/specs/chegala-er.md`.
- **Rotas Wave 2 definidas** — 37 novas rotas, 7 novos eventos SSE em `.projeto/wave-2/specs/chegala-design.md`.

## Especificacao

### 1. Schemas Zod — Novas Entidades

Criar schemas Zod para as novas entidades conforme `.projeto/wave-2/specs/chegala-er.md`:

| Arquivo | Entidades |
|---------|-----------|
| `entities/pricing-table.ts` | PricingTableSchema, PricingRuleSchema, PricingRuleTypeEnum, SurchargeTypeEnum, SurchargeModeEnum |
| `entities/delivery-price.ts` | DeliveryPriceSchema |
| `entities/financial-closing.ts` | FinancialClosingSchema, FinancialClosingItemSchema, ClosingStatusEnum, ClosingPeriodEnum |
| `entities/invoice.ts` | InvoiceSchema, InvoiceItemSchema, InvoiceStatusEnum |
| `entities/delivery-proof.ts` | DeliveryProofSchema |
| `entities/company-config.ts` | CompanyConfigSchema |
| `entities/shop-pricing-override.ts` | ShopPricingOverrideSchema |

Seguir padrao existente: cada arquivo exporta schemas nomeados com sufixo `Schema`, enums sem sufixo. Atualizar barrel export em `entities/index.ts`.

### 2. Schemas Zod — API Request/Response

Criar schemas de API conforme `.projeto/wave-2/specs/chegala-design.md` secao "REST — Novas Rotas":

| Arquivo | Schemas |
|---------|---------|
| `api/pricing.ts` | CreatePricingTableRequest, UpdatePricingTableRequest, CreatePricingRuleRequest, UpdatePricingRuleRequest, SimulatePriceRequest, SetPricingOverrideRequest |
| `api/financial.ts` | CreateClosingRequest, ClosingListQuery |
| `api/invoices.ts` | CreateInvoiceRequest, InvoiceListQuery |
| `api/analytics.ts` | AnalyticsPeriodQuery |
| `api/delivery-proof.ts` | — (multipart, schema apenas para response) |
| `api/company-config.ts` | UpdateCompanyConfigRequest |

Atualizar barrel export em `api/index.ts`.

### 3. Schemas Zod — Novos Eventos SSE

Criar schemas de eventos conforme `.projeto/wave-2/specs/chegala-design.md` secao "Eventos SSE Tipados":

| Arquivo | Schemas |
|---------|---------|
| `events/financial.ts` | ClosingCreatedEvent, ClosingPaidEvent |
| `events/invoice.ts` | InvoiceCreatedEvent, InvoiceSentEvent |
| `events/delivery-price.ts` | DeliveryPricedEvent |

Atualizar barrel export em `events/index.ts`.

### 4. Schema Drizzle — Novas Tabelas

Criar Drizzle schema em `apps/backbone/db/schema/` para as 10 novas tabelas conforme `.projeto/wave-2/specs/chegala-er.md`:

| Arquivo | Tabelas |
|---------|---------|
| `pricing.ts` | pricing_tables, pricing_rules, shop_pricing_overrides |
| `financial.ts` | financial_closings, financial_closing_items |
| `invoices.ts` | invoices, invoice_items |
| `delivery-proof.ts` | delivery_proofs |
| `delivery-price.ts` | delivery_prices |
| `company-config.ts` | company_configs |

Seguir padrao existente: UUID PKs com `gen_random_uuid()`, `timestamptz` para datas, `numeric(10,2)` para valores monetarios (RNF023), `numeric(10,7)` para coordenadas. Novos enums via `pgEnum` no arquivo `_enums.ts` existente.

Atualizar barrel export em `db/schema/index.ts`.

### 5. Migrations

Gerar migration via `drizzle-kit generate`. Adicionar manualmente ao SQL:

- Indices conforme `.projeto/wave-2/specs/chegala-er.md` secao "Indices Recomendados" (13 indices, incluindo partial unique para pricing_tables active)
- Triggers conforme `.projeto/wave-2/specs/chegala-er.md` secao "Triggers" (4 triggers updated_at + trigger invoice_number + trigger single_active_pricing_table)

Aplicar migration via `db:migrate`.

### 6. Servico de Distancia

Criar `apps/backbone/src/services/distance.service.ts`:

- Funcao `calculateHaversineDistance(lat1, lng1, lat2, lng2): number` — retorna distancia em km (RNF022)
- Sem dependencias externas — formula matematica pura
- Precisao suficiente para distancias urbanas (< 50km)

### 7. Servico de Precificacao

Criar `apps/backbone/src/services/pricing.service.ts`:

- Calcular preco da entrega ao atribuir motoboy (momento em que coleta e destino estao definidos) (OSD207)
- Buscar tabela de preco: primeiro verificar override do lojista (`shop_pricing_overrides`), senao usar tabela ativa da empresa (OSD208)
- Calcular distancia estimada via Haversine entre coordenadas de coleta e entrega (OSD207)
- Avaliar regras da tabela por prioridade conforme `.projeto/wave-2/specs/chegala-design.md` secao "Fluxo — Calculo de Preco": per_km (OSD201), distance_range (OSD202), neighborhood (OSD203), flat_rate (OSD204)
- Aplicar surcharges ativos: percentage ou fixed (OSD205)
- Gravar resultado em `delivery_prices` com referencia a tabela e regra aplicada (OSD209)
- Emitir evento SSE `delivery_priced` no canal da empresa
- Expor funcao de recalculo para quando distancia real divergir (OSD210)

### 8. Rotas de Precificacao

Criar `apps/backbone/src/routes/pricing.ts` com rotas conforme `.projeto/wave-2/specs/chegala-design.md` secao "Tabela de Precos":

- CRUD de tabelas de preco (GET, POST, PATCH, DELETE `/api/pricing-tables`) (OSD200, OSD206)
- CRUD de regras por tabela (GET, POST `/api/pricing-tables/:id/rules`, PATCH, DELETE `/api/pricing-rules/:id`) (OSD201-OSD205)
- Simulacao de calculo (POST `/api/pricing-tables/:id/simulate`) — preview sem gravar
- Override por lojista (GET, PUT, DELETE `/api/shops/:id/pricing-override`) (OSD208)
- Ao ativar tabela (PATCH com `active: true`), desativar a anterior automaticamente (OSD206)

### 9. Rotas de Configuracao da Empresa

Criar `apps/backbone/src/routes/company-config.ts`:

- GET `/api/company/config` — retorna configuracoes da empresa
- PATCH `/api/company/config` — atualizar `pod_required`, `default_closing_period`, `default_invoice_period` (OSD285)
- Criar config automaticamente se nao existir (upsert com defaults)

### 10. Integracao com DeliveryService

Modificar `apps/backbone/src/services/delivery.service.ts`:

- Ao atribuir motoboy (assign), chamar `pricingService.calculateDeliveryPrice()` automaticamente (OSD207)
- Preco calculado antes de notificar via SSE

## Limites

- **Nao implementar rotas de fechamento financeiro, faturas, POD ou analytics** — escopo do PRP-002.
- **Nao implementar frontend** — apenas backend.
- **Nao alterar schemas Zod existentes da Wave 1** — adicionar novos arquivos, nao modificar existentes.
- **Nao alterar schema Drizzle existente da Wave 1** — adicionar novos arquivos ao `db/schema/`. Atualizar apenas o `index.ts` para exportar as novas tabelas.
- **Nao alterar rotas existentes** — exceto a integracao minima com `delivery.service.ts` para trigger de precificacao.
- **Nao criar testes** — testes serao adicionados em waves futuras.
- **Nao usar APIs externas para calculo de distancia** — usar Haversine (decisao vinculante em design.md).
