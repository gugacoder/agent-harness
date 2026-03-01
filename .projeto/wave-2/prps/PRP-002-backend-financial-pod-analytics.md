---
status: current
---

# PRP-002 — Backend Financeiro, Faturamento, POD e Analytics

Implementar todas as rotas REST, services e integracao SSE para fechamento financeiro de motoboys, extrato do motoboy, faturamento do lojista (incluindo PDF), Proof of Delivery (upload via Supabase Storage) e dashboard analitico.

## Objetivo

Produzir o backend completo da Wave 2 em `apps/backbone/`: APIs de fechamento financeiro, extrato do motoboy, faturas do lojista com geracao de PDF, upload e consulta de comprovantes de entrega via Supabase Storage, queries analiticas para dashboard, e emissao de eventos SSE para notificacoes em tempo real.

## Execution Mode

`implementar`

## Contexto

- **PRP-001 Wave 2 ja executado** — schemas Zod (entities, API, events) criados em `packages/shared/schemas/`. Drizzle schema com 10 novas tabelas criado em `apps/backbone/db/schema/`. Migrations aplicadas. Servico de precificacao funcional: calcula preco ao atribuir motoboy, grava em `delivery_prices`, emite SSE. Servico de distancia Haversine implementado. CRUD de tabelas de preco e regras funcional. Config de empresa funcional.
- **SSE existente** — `apps/backbone/src/sse/manager.ts` gerencia canais. Canais existentes: `company/{id}`, `courier/{id}`, `order/{id}`. Broadcast via `sseManager.broadcast(channel, event)`. Novos eventos Wave 2 definidos nos schemas: `closing_created`, `closing_paid`, `invoice_created`, `invoice_sent`.
- **Supabase Storage disponivel** — Docker Compose inclui Supabase self-hosted com Storage na API do Kong. Client `@supabase/supabase-js` disponivel. Bucket para fotos de POD precisa ser criado.
- **Specs de referencia** — requisitos em `chegala-requirements.md`, user stories em `chegala-user-stories.md`, rotas e fluxos em `chegala-design.md`, modelo de dados em `chegala-er.md` — todos em `.projeto/wave-2/specs/`.

## Especificacao

### 1. Servico de Fechamento Financeiro

Criar `apps/backbone/src/services/financial.service.ts`:

- Gerar fechamento por motoboy em periodo (OSD220):
  1. Buscar entregas do motoboy com status `delivered` no periodo que nao pertencem a nenhum fechamento existente (conforme fluxo em design.md secao "Fechamento Financeiro")
  2. Calcular totais: quantidade de entregas, distancia total (soma de `delivery_prices.actual_distance_km` ou `estimated_distance_km`), valor total a pagar (soma de `delivery_prices.total_price`) (OSD221)
  3. Criar `financial_closing` com status `draft` e `financial_closing_items` com snapshots de preco e distancia por entrega (OSD222)
  4. Emitir SSE `closing_created` no canal company
- Confirmar fechamento: `draft` → `confirmed` (OSD225)
- Pagar fechamento: `confirmed` → `paid`. Impedir alteracao apos `paid` (OSD225, OSD226). Emitir SSE `closing_paid` no canal company e canal courier (OSD227)
- Processamento em menos de 5 segundos p95 para ate 500 entregas (RNF025)

### 2. Rotas de Fechamento Financeiro

Criar `apps/backbone/src/routes/financial.ts` conforme design.md secao "Fechamento Financeiro":

| Metodo | Rota | Descricao | Requisitos |
|--------|------|-----------|------------|
| GET | /api/financial/closings | Listar fechamentos (filtro: courier_id, status, periodo) | OSD223 |
| POST | /api/financial/closings | Gerar fechamento | OSD220, OSD221, US061 |
| GET | /api/financial/closings/:id | Detalhes com items | OSD224, US061, US062 |
| PATCH | /api/financial/closings/:id/confirm | Confirmar | OSD225 |
| PATCH | /api/financial/closings/:id/pay | Marcar pago | OSD225, OSD226 |

### 3. Rotas de Extrato do Motoboy

Criar `apps/backbone/src/routes/earnings.ts` (ou adicionar a `financial.ts`):

| Metodo | Rota | Descricao | Requisitos |
|--------|------|-----------|------------|
| GET | /api/couriers/me/earnings | Extrato do motoboy autenticado (filtro: periodo). Lista entregas com data, lojista, distancia, valor. | OSD240, OSD243, OSD244, OSD245, US101 |
| GET | /api/couriers/me/earnings/summary | Resumo: total dia, total semana, total mes | OSD241, OSD242, US101 |

Auth: restringir a role `courier`. Usar `user_id` do JWT para identificar motoboy.

### 4. Servico de Faturamento

Criar `apps/backbone/src/services/invoice.service.ts`:

- Gerar fatura por lojista em periodo (OSD260):
  1. Buscar entregas do lojista com status `delivered` no periodo que nao pertencem a nenhuma fatura existente (conforme fluxo em design.md secao "Faturamento do Lojista")
  2. Calcular totais (OSD262)
  3. Criar `invoice` com status `draft` + `invoice_items` com snapshots (OSD261)
  4. Numero sequencial por empresa via trigger (er.md)
  5. Emitir SSE `invoice_created` no canal company
- Enviar fatura: `draft` → `sent`. Emitir SSE `invoice_sent` no canal company e canal order para o lojista (OSD266)
- Pagar fatura: `sent` → `paid`. Impedir alteracao apos `paid` (OSD268)
- Processamento em menos de 5 segundos p95 para ate 500 entregas (RNF025)

### 5. Servico de PDF

Criar `apps/backbone/src/services/pdf.service.ts`:

- Gerar PDF de fatura com formatacao profissional (RNF024)
- Conteudo: logo da empresa, dados do lojista, periodo, detalhamento das entregas (data, pedido, endereco coleta, endereco entrega, distancia, valor), total (OSD261, OSD264)
- Usar `@react-pdf/renderer` (server-side) ou alternativa leve como `pdfkit` se `@react-pdf/renderer` nao rodar em Node puro — avaliar no momento da implementacao. A decisao e: gerar PDF no backend, retornar como stream.
- Retornar buffer/stream para download direto

### 6. Rotas de Faturas

Criar `apps/backbone/src/routes/invoices.ts` conforme design.md secao "Faturas":

| Metodo | Rota | Descricao | Requisitos |
|--------|------|-----------|------------|
| GET | /api/invoices | Listar faturas (filtro: shop_id, status, periodo) | OSD267, US065 |
| POST | /api/invoices | Gerar fatura | OSD260, OSD261, OSD262 |
| GET | /api/invoices/:id | Detalhes com items | OSD261, US065 |
| PATCH | /api/invoices/:id/send | Enviar fatura | OSD265, OSD266 |
| PATCH | /api/invoices/:id/pay | Marcar paga | OSD265, OSD268 |
| GET | /api/invoices/:id/pdf | Download PDF | OSD264, RNF024 |
| GET | /api/shops/me/invoices | Faturas do lojista autenticado | OSD263, OSD267, US080 |

### 7. Servico e Rotas de POD

Criar `apps/backbone/src/services/pod.service.ts` e `apps/backbone/src/routes/delivery-proof.ts`:

- Upload de comprovante (POST `/api/deliveries/:id/proof`) — multipart com photo e signature (OSD280, OSD281):
  1. Validar que a entrega pertence ao motoboy autenticado e esta em status adequado
  2. Validar tamanho da foto: max 2MB (RNF020)
  3. Upload da foto para Supabase Storage bucket `delivery-proofs` (OSD283)
  4. Upload da assinatura para Supabase Storage bucket `delivery-proofs` (OSD283)
  5. Gravar `delivery_proofs` com URLs, coordenadas GPS e timestamp do dispositivo (OSD282)
- Consulta de comprovante (GET `/api/deliveries/:id/proof`) — retornar dados do comprovante incluindo URLs das imagens (OSD284, OSD286)
- Auth: upload restrito a role `courier`. Consulta permitida a `operator`, `shop` e `courier` (conforme matriz de permissoes em requirements.md)

### 8. Servico e Rotas de Analytics

Criar `apps/backbone/src/services/analytics.service.ts` e `apps/backbone/src/routes/analytics.ts`:

| Metodo | Rota | Descricao | Requisitos |
|--------|------|-----------|------------|
| GET | /api/analytics/overview | Volume total, concluidas, canceladas, taxa conclusao, tempo medio entrega | OSD300, OSD303, OSD304 |
| GET | /api/analytics/couriers | Performance por motoboy: entregas, tempo medio, distancia media | OSD301 |
| GET | /api/analytics/neighborhoods | Volume por bairro (lista rankeada) | OSD302 |
| GET | /api/analytics/revenue | Receita total e media por entrega | OSD306 |
| GET | /api/analytics/trend | Entregas por dia no periodo selecionado | OSD307 |

Todas as rotas aceitam query params de periodo (OSD305): `period_start`, `period_end`, ou atalhos `period=day|week|month|custom`.
Auth: restrito a role `operator`.

### 9. Integracao SSE

Registrar emissao dos novos eventos SSE nos services:

| Evento | Canal | Quando | Service |
|--------|-------|--------|---------|
| closing_created | company/{id} | Fechamento gerado | financial.service |
| closing_paid | company/{id} + courier/{id} | Fechamento pago | financial.service |
| invoice_created | company/{id} | Fatura gerada | invoice.service |
| invoice_sent | company/{id} + order/{id} | Fatura enviada | invoice.service |

Usar schemas de eventos de `packages/shared/schemas/events/financial.ts` e `events/invoice.ts`.

### 10. Bucket Supabase Storage

Criar bucket `delivery-proofs` no Supabase Storage. Pode ser via migration SQL, via script de setup, ou via API do Supabase — usar a abordagem mais consistente com o setup existente do projeto.

## Limites

- **Nao implementar frontend** — apenas backend.
- **Nao alterar schemas Zod criados no PRP-001** — apenas consumir.
- **Nao alterar schema Drizzle ou migrations do PRP-001** — apenas consumir.
- **Nao alterar servico de precificacao** — apenas consumir `delivery_prices` nas queries.
- **Nao implementar compressao de imagem no backend** — compressao e responsabilidade do client (RNF021). Backend apenas valida tamanho max (RNF020).
- **Nao criar testes** — testes serao adicionados em waves futuras.
- **Nao implementar geolocation no backend** — coordenadas GPS vem do client no request.
