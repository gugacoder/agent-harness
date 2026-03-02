---
status: current
---

# PRP-008 — Quality Pass Central

## Objetivo

Implementar melhorias de completude na Central: cards de metricas do dia no dashboard, timeline visual de pedidos e atribuicao em lote (bulk assign).

## Execution Mode

`implementar`

## Contexto

**Dashboard:** `apps/central/src/pages/DashboardPage.tsx` (~150 linhas) exibe KPIs e pedidos recentes. Analytics backend tem `GET /api/analytics/overview` com metricas agregadas, mas nao tem endpoint especifico para metricas "de hoje" em tempo real.

**Pedidos:** `apps/central/src/pages/PedidosPage.tsx` (~250 linhas) lista pedidos com filtros por status. Detalhes do pedido mostram dados basicos. Nao tem timeline visual. Delivery events ja existem no banco (`delivery_events`) e no endpoint `GET /api/deliveries/:id/events`.

**Atribuicao:** Atualmente, atribuicao e feita um pedido por vez via `POST /api/orders/:orderId/assign`. Nao ha endpoint de bulk assign.

## Especificacao

### 1. Backend — endpoint de metricas do dia

Criar rota `GET /api/analytics/today` em `apps/backbone/src/routes/analytics.ts`:

Response:
```typescript
{
  deliveries_today: number,        // COUNT deliveries WHERE delivered_at >= hoje 00:00
  deliveries_today_completed: number, // COUNT WHERE status = 'delivered' AND delivered_at >= hoje 00:00
  couriers_online: number,         // COUNT couriers WHERE status IN ('available', 'busy')
  orders_pending: number           // COUNT orders WHERE status = 'pending'
}
```

Query em tempo real (nao cacheada). Role check: operator only.

### 2. Backend — timeline do pedido

Criar rota `GET /api/orders/:id/timeline` em `apps/backbone/src/routes/orders.ts`:

Response: array de eventos ordenados por created_at ASC:
```typescript
[{
  event_type: string,      // "status_change" | "location_update" | "note"
  old_status: string | null,
  new_status: string | null,
  description: string,
  actor_name: string,      // JOIN com profiles para nome
  created_at: string
}]
```

Buscar de `delivery_events` via delivery_id (obter delivery pela order_id). Se pedido nao tem delivery ainda, retornar array com evento sintetico de criacao do pedido.

### 3. Backend — bulk assign

Criar rota `POST /api/orders/bulk-assign` em `apps/backbone/src/routes/orders.ts`:

Request body:
```typescript
{
  order_ids: string[],  // UUIDs dos pedidos (min 1, max 50)
  courier_id: string     // UUID do motoboy
}
```

Response:
```typescript
{
  results: [{
    order_id: string,
    success: boolean,
    error?: string       // "already_assigned", "order_not_found", "invalid_status"
  }]
}
```

Logica:
- Validar que todos os pedidos pertencem ao company_id
- Validar que motoboy pertence ao company_id e esta ativo
- Para cada pedido: verificar status = 'pending', criar delivery, atualizar status para 'assigned'
- Executar em transacao. Se um falhar, continuar com os demais (partial success)
- Broadcast SSE: delivery_assigned para cada sucesso

### 4. Frontend — TodayCards

Criar `apps/central/src/components/dashboard/TodayCards.tsx` (OSD610):
- 3-4 cards em grid: "Entregas Hoje", "Motoboys Online", "Pedidos Pendentes"
- Buscar de GET /api/analytics/today via react-query (refetch a cada 30s)
- Card com icone, numero grande, label descritivo
- Cores: entregas (primary), online (green), pendentes (accent)

Integrar no `DashboardPage.tsx` acima do conteudo existente.

### 5. Frontend — OrderTimeline

Criar `apps/central/src/components/orders/OrderTimeline.tsx` (OSD611):
- Timeline vertical: linha conectando circulos de status
- Cada ponto: icone do status, label, timestamp formatado (HH:mm dd/MM)
- Status atual: circulo preenchido com cor do status badge
- Status futuros: circulo vazio, cinza
- Se disponivel: nome do ator (quem fez a transicao)

**Props:**
```typescript
interface OrderTimelineProps {
  orderId: string
}
```

Buscar de GET /api/orders/:id/timeline. Skeleton loading enquanto carrega.

Integrar na tela de detalhes do pedido (PedidosPage → detalhes) como secao visual.

### 6. Frontend — BulkAssignDialog

Criar `apps/central/src/components/orders/BulkAssignDialog.tsx` (OSD612):

**Integracao no PedidosPage:**
- Adicionar checkbox em cada row/card de pedido quando status = "pending"
- Botao "Atribuir Selecionados" no toolbar (habilitado quando >= 1 selecionado)
- Badge com contagem de selecionados

**Dialog:**
- Titulo: "Atribuir N pedidos"
- Select/combobox para escolher motoboy (lista de motoboys com status available/busy)
- Botao confirmar
- Submit: POST /api/orders/bulk-assign
- Resultado: toast de sucesso com contagem, ou lista de erros se parcial
- Ao fechar: limpar selecao, invalidar cache de pedidos

## Limites

- Nao alterar endpoints existentes de analytics (overview, couriers, etc.)
- Nao implementar WebSocket ou polling — usar react-query refetch para metricas do dia
- Nao implementar drag-and-drop para atribuicao
- Bulk assign maximo de 50 pedidos por request
- Timeline usa dados de delivery_events existentes — nao criar novos event types
