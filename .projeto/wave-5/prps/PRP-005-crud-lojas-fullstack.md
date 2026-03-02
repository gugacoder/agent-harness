---
status: current
---

# PRP-005 — CRUD Lojas Full Stack

## Objetivo

Completar o CRUD de lojas com detalhes, edicao, desativacao no backend e frontend (Central).

## Execution Mode

`implementar`

## Contexto

**Backend:** `apps/backbone/src/routes/shops.ts` (~182 linhas) tem apenas `GET /api/shops` (listar) e `POST /api/shops` (criar). Nao tem GET por ID, PATCH, nem desativacao. O servico de shops e minimo. A tabela `shops` agora tem campo `contact_name` (PRP-001).

**Frontend:** `apps/central/src/pages/LojistasPage.tsx` (~680 linhas) tem lista com filtros (ativo/inativo), formulario de criacao (`NewShopForm`) e card de detalhes basico (`ShopDetail`). O padrao de UI e similar ao `MotoboysPage`: `useState` para view (list/new/detail), `@tanstack/react-query`, `ky` HTTP client.

Analytics e financeiro ja existem como endpoints: `GET /api/analytics/*`, `GET /api/invoices` (com filtro por shop_id).

O componente `AddressAutocomplete` ja existe (PRP-004) para uso no formulario de edicao.

## Especificacao

### 1. Backend — novas rotas em `shops.ts`

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/shops/:id | Detalhes da loja com total_orders e last_order_date (aggregate query) |
| PATCH | /api/shops/:id | Atualizar: trade_name, phone, address, lat, lng, contact_name |
| PATCH | /api/shops/:id/status | Alternar active (true/false). Body: `{ active: boolean }` |
| GET | /api/shops/:id/orders | Pedidos da loja, paginados. Query: limit (default 20), offset, status, period (default ultimos 30 dias) |
| GET | /api/shops/:id/financial-summary | Resumo: total_invoiced, total_pending, last_payment_date. Agregacao das tabelas invoices e invoice_items |

Todas as rotas: verificar que a loja pertence ao company_id do middleware. GET /:id deve incluir contagem de pedidos e data do ultimo pedido como campos extras no response.

### 2. Backend — servico

Criar ou estender `apps/backbone/src/services/shop.service.ts`:
- `getShopById(id, companyId)` — retorna shop + total_orders + last_order_date
- `updateShop(id, companyId, data)` — atualiza campos permitidos
- `toggleShopStatus(id, companyId, active)` — altera flag active
- `getShopOrders(id, companyId, options)` — lista pedidos paginados
- `getShopFinancialSummary(id, companyId)` — agregar invoices

### 3. Frontend — Central

**ShopDetailView** (`apps/central/src/components/shops/ShopDetailView.tsx`):
Substituir o card basico existente em `LojistasPage` por componente completo:
- Dados cadastrais: nome, telefone, endereco, contato, status badge
- Mapa com pin da localizacao (usar Leaflet MapContainer read-only)
- Cards de resumo: total pedidos, total faturado, pendente, ultimo pagamento
- Historico de pedidos (ultimos 30 dias): lista paginada com status badge, data, valor
- Acoes: botao "Editar", botao "Desativar/Reativar"

**ShopEditForm** (`apps/central/src/components/shops/ShopEditForm.tsx`):
Drawer ou modal com formulario:
- Campos: trade_name, phone, contact_name
- Endereco: usar `AddressAutocomplete` + `AddressPinDrop` (do PRP-004) para editar address + lat/lng
- Validacao Zod
- Submit: PATCH /api/shops/:id
- Invalidar cache react-query apos sucesso

**LojistasPage enhancements:**
- Lista: adicionar colunas/campos — total pedidos, data ultimo pedido
- Filtro de busca por nome (input de texto, filtragem client-side ou query param)
- Click na loja → navegar para tela de detalhes (ou expandir ShopDetailView)
- Acoes inline: editar (abre drawer), desativar (dialog confirmacao)
- Dialog de desativacao: "Desativar loja {nome}? Pedidos em andamento serao mantidos."

### 4. Hook

Criar `apps/central/src/hooks/useShopDetail.ts`:
- `useShopDetail(shopId)` — GET /api/shops/:id
- `useShopOrders(shopId, options)` — GET /api/shops/:id/orders
- `useShopFinancialSummary(shopId)` — GET /api/shops/:id/financial-summary
- Mutations: `useUpdateShop()`, `useToggleShopStatus()`

## Limites

- Nao implementar criacao de novas lojas (ja existe no NewShopForm atual)
- Nao alterar o fluxo de criacao existente
- Nao alterar tabelas do banco (ja feito no PRP-001)
- Nao implementar CRUD de motoboys neste PRP (PRP-006)
- O resumo financeiro usa apenas dados existentes das tabelas invoices/invoice_items — nao criar novas tabelas
