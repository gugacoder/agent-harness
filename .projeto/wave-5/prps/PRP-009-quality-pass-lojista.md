---
status: current
---

# PRP-009 — Quality Pass Lojista

## Objetivo

Implementar estimativa de custo antes de confirmar pedido, filtros no historico de pedidos e tela de detalhes da entrega com timeline e POD no app lojista.

## Execution Mode

`implementar`

## Contexto

**NovaEntregaPage** (`apps/lojista/src/pages/NovaEntregaPage.tsx`, ~237 linhas): formulario com React Hook Form + Zod. Apos PRP-004, tera AddressAutocomplete e coordenadas reais. Nao tem estimativa de custo.

**HistoricoPage** (`apps/lojista/src/pages/HistoricoPage.tsx`): lista de pedidos passados. Sem filtros por data/status/valor.

**Pricing:** Backend tem `pricing.service.ts` com calculo de preco baseado em tabela ativa. Endpoint `POST /api/pricing-tables/:id/simulate` aceita distancia e retorna preco. Falta endpoint simplificado que aceita coordenadas e retorna estimativa.

**Timeline:** `GET /api/deliveries/:id/events` retorna eventos. `GET /api/orders/:id/timeline` sera criado no PRP-008.

**POD:** `GET /api/deliveries/:id/proof` retorna foto + assinatura.

## Especificacao

### 1. Backend — endpoint de estimativa

Criar rota `GET /api/orders/estimate` em `apps/backbone/src/routes/orders.ts`:

Query params:
- `pickup_lat`, `pickup_lng` (coordenadas de coleta)
- `delivery_lat`, `delivery_lng` (coordenadas de destino)

Logica:
1. Calcular distancia Haversine entre os pontos (reutilizar `distance.service.ts` existente)
2. Buscar pricing table ativa da empresa (ou override do lojista se shop_id fornecido)
3. Aplicar regras de precificacao (reutilizar `pricing.service.ts`)
4. Retornar:
```typescript
{
  estimated_distance_km: number,
  estimated_price: number,
  pricing_table_name: string
}
```

Se nenhuma pricing table ativa: retornar 404 com mensagem "Nenhuma tabela de precos ativa".

Role check: operator e shop.

### 2. Frontend — CostEstimate

Criar `apps/lojista/src/components/orders/CostEstimate.tsx` (OSD625):

**Props:**
```typescript
interface CostEstimateProps {
  pickupLat: number
  pickupLng: number
  deliveryLat: number
  deliveryLng: number
  enabled: boolean  // false enquanto coordenadas nao definidas
}
```

**Comportamento:**
- Quando enabled e coordenadas validas (nao 0): chamar GET /api/orders/estimate
- Exibir card com: distancia estimada (ex: "3.2 km") e valor (ex: "R$ 12,50")
- Loading: skeleton
- Erro (404 sem tabela): mensagem "Estimativa indisponivel"
- Atualiza automaticamente se coordenadas mudarem (debounce 500ms)

**Integracao no NovaEntregaPage:**
- Renderizar abaixo do mapa/pin drop
- Passar coordenadas do formulario como props
- Exibir antes do botao "Solicitar Entrega"

### 3. Frontend — OrderHistoryFilters

Criar `apps/lojista/src/components/orders/OrderHistoryFilters.tsx` (OSD626):

**Filtros:**
- Data: range picker (date_from, date_to). Default: ultimo mes
- Status: select multiplo (pending, assigned, picked_up, in_transit, delivered, cancelled)
- Valor: range (min, max) — numerico

**Integracao:**
- Renderizar acima da lista no HistoricoPage
- Filtros aplicados via query params no GET /api/orders (ja suporta filtro por status)
- Para filtro de data e valor: se o backend nao suportar, filtrar client-side (dados paginados)
- Contagem de resultados abaixo dos filtros: "N pedidos encontrados"

**Backend — extensao opcional:**
Se GET /api/orders nao suportar filtro por data/valor, adicionar query params:
- `date_from`, `date_to` (ISO date string)
- `min_amount`, `max_amount` (numerico — requer JOIN com delivery_prices)

### 4. Frontend — OrderDetailView

Criar `apps/lojista/src/components/orders/OrderDetailView.tsx` (OSD627):

**Conteudo:**
- Header: numero do pedido, status badge
- Endereco de destino com mapa (MapContainer read-only, marcador no ponto)
- Timeline visual (reutilizar conceito do OrderTimeline do PRP-008, adaptado para lojista):
  - Buscar de GET /api/orders/:id/timeline
  - Timeline vertical com status e timestamps
- Motoboy atribuido (se houver): nome, foto, telefone
- POD (se houver): foto e assinatura via GET /api/deliveries/:id/proof
- Valor da entrega (se calculado): via delivery_prices

**Integracao:**
- Acessivel ao clicar num pedido no HistoricoPage ou PedidosPage
- Navegacao: nova rota `/pedidos/:id` no lojista, ou drawer/modal sobre a lista

### 5. Hook

Criar `apps/lojista/src/hooks/useOrderDetail.ts`:
- `useOrderDetail(orderId)` — GET /api/orders/:id
- `useOrderTimeline(orderId)` — GET /api/orders/:id/timeline
- `useOrderDeliveryProof(deliveryId)` — GET /api/deliveries/:id/proof (ja existe como hook)
- `useOrderEstimate(coords)` — GET /api/orders/estimate

## Limites

- Nao alterar o pricing.service.ts (reutilizar como esta)
- Nao implementar recalculo de preco apos entrega (escopo de PRP anterior)
- Estimativa e informativa — o valor real pode diferir (surcharges, distancia real)
- Filtro por valor depende de delivery_prices existir para o pedido — se nao existir, filtro de valor nao se aplica a esse pedido
- Nao implementar export/CSV do historico neste PRP
