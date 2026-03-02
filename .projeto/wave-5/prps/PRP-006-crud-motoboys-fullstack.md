---
status: current
---

# PRP-006 — CRUD Motoboys Full Stack

## Objetivo

Completar o CRUD de motoboys com detalhes, metricas, edicao e desativacao no backend e frontend (Central).

## Execution Mode

`implementar`

## Contexto

**Backend:** `apps/backbone/src/routes/couriers.ts` (~533 linhas) tem: GET (listar com filtros), GET /me, POST (criar), PATCH /:id/status (status online/offline/busy), PATCH /:id (toggle active), POST /:id/location. Nao tem GET por ID com metricas, historico de entregas, nem endpoint de metricas dedicado. A tabela `couriers` agora tem `vehicle_type` e `plate_number` (PRP-001).

**Frontend:** `apps/central/src/pages/MotoboysPage.tsx` (~705 linhas) tem lista com filtros (all/available/busy/offline/inactive), formulario de criacao (`NewCourierForm`) e card de detalhes basico (`CourierDetail`). O padrao usa `useState` para view, `@tanstack/react-query`, `ky`.

Analytics de motoboys ja existe: `GET /api/analytics/couriers` retorna per-courier performance. Earnings: `GET /api/couriers/me/earnings` (para o proprio motoboy), mas nao ha endpoint de earnings por courier_id para o operador.

## Especificacao

### 1. Backend — novas rotas em `couriers.ts`

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/couriers/:id | Detalhes do motoboy com metricas basicas. Inclui: dados pessoais, vehicle_type, plate_number, status, total_deliveries, localizacao atual (mais recente de courier_locations) |
| PATCH | /api/couriers/:id | Atualizar: full_name, phone, vehicle_type, plate_number, photo_url. Verificar company_id |
| PATCH | /api/couriers/:id/active | Alternar active flag. Body: `{ active: boolean }` |
| GET | /api/couriers/:id/deliveries | Entregas do motoboy, paginadas. Query: limit (default 20), offset, status, period (default ultimos 30 dias) |
| GET | /api/couriers/:id/metrics | Metricas: deliveries_today, deliveries_month, avg_delivery_time_min, completion_rate, total_distance_km. Agregacao de deliveries + delivery_events |

Diferenciar do PATCH /:id existente (que faz toggle active). O novo PATCH /:id recebe body com campos a atualizar. Se conflito, renomear a rota existente para PATCH /:id/active (toggle).

### 2. Backend — servico

Estender `apps/backbone/src/services/courier.service.ts`:
- `getCourierById(id, companyId)` — retorna courier + ultima localizacao
- `updateCourier(id, companyId, data)` — atualiza campos permitidos
- `toggleCourierActive(id, companyId, active)` — altera flag active
- `getCourierDeliveries(id, companyId, options)` — lista entregas paginadas (join com orders para order_number e enderecos)
- `getCourierMetrics(id, companyId)` — agregar de deliveries e delivery_events:
  - deliveries_today: COUNT WHERE delivered_at >= hoje 00:00
  - deliveries_month: COUNT WHERE delivered_at >= primeiro dia do mes
  - avg_delivery_time_min: AVG(delivered_at - assigned_at) WHERE status = 'delivered'
  - completion_rate: delivered / total * 100
  - total_distance_km: SUM(actual_distance_km)

### 3. Frontend — Central

**CourierDetailView** (`apps/central/src/components/couriers/CourierDetailView.tsx`):
Substituir o card basico existente em `MotoboysPage`:
- Dados pessoais: foto, nome, telefone, veiculo, placa, status badge
- Mapa com localizacao atual (se online) — MapContainer com marcador
- Cards de metricas: entregas hoje, entregas mes, tempo medio, taxa conclusao
- Earnings acumulados com seletor de periodo (dia/semana/mes)
- Historico de entregas (ultimos 30 dias): lista paginada
- Acoes: botao "Editar", botao "Desativar/Reativar"

**CourierEditForm** (`apps/central/src/components/couriers/CourierEditForm.tsx`):
Drawer ou modal:
- Campos: full_name, phone, vehicle_type (select: moto/bicicleta/carro), plate_number
- Validacao Zod
- Submit: PATCH /api/couriers/:id
- Invalidar cache apos sucesso

**MotoboysPage enhancements:**
- Lista: garantir que foto, total entregas e status badge estao visíveis
- Mapa pequeno acima da lista mostrando motoboys ativos (reutilizar logica do MapaPage simplificada)
- Filtro de busca por nome
- Click → tela de detalhes (ou expandir CourierDetailView)
- Acoes inline: editar (drawer), desativar (dialog confirmacao)

### 4. Hooks

Criar `apps/central/src/hooks/useCourierDetail.ts`:
- `useCourierDetail(courierId)` — GET /api/couriers/:id
- `useCourierDeliveries(courierId, options)` — GET /api/couriers/:id/deliveries
- `useCourierMetrics(courierId)` — GET /api/couriers/:id/metrics
- Mutations: `useUpdateCourier()`, `useToggleCourierActive()`

## Limites

- Nao alterar o fluxo de criacao de motoboys (NewCourierForm) — apenas enriquecer detalhes e edicao
- Nao alterar tabelas do banco (PRP-001 ja adicionou os campos)
- Nao implementar GPS badge ou tracking fix neste PRP (PRP-007)
- O mapa na listagem e simplificado (apenas pins dos ativos, sem interatividade complexa)
- Earnings: reutilizar dados de financial_closings existentes, nao criar novas queries complexas
