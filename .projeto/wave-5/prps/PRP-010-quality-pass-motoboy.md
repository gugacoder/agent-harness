---
status: current
---

# PRP-010 — Quality Pass Motoboy

## Objetivo

Implementar melhorias de usabilidade no app motoboy: botao de navegacao para endereco, notificacao sonora/vibracao de nova entrega, preview com distancia e valor antes de aceitar, e contexto visual na pagina de status.

## Execution Mode

`implementar`

## Contexto

**EntregasPage** (`apps/motoboy/src/pages/EntregasPage.tsx`, ~167 linhas): exibe entrega ativa com status buttons e fluxo de POD. Entrega pendente mostra botoes Accept/Reject. Nao mostra distancia/valor antes de aceitar. Nao tem botao "Navegar".

**StatusPage** (`apps/motoboy/src/pages/StatusPage.tsx`): toggle online/offline. Sem contexto visual (quantas entregas disponiveis, etc).

**SSE:** `useCourierEvents` recebe evento `delivery_assigned` quando entrega e atribuida. Atualmente so atualiza estado — nao emite som ou vibracao.

**ActiveDeliveryContext:** gerencia estado da entrega ativa (pendingDelivery, activeDelivery). Dados incluem order com delivery_address, delivery_lat, delivery_lng.

**Pricing:** apos PRP-009, endpoint `GET /api/orders/estimate` existe. Delivery pode ter `delivery_prices` com valor calculado.

## Especificacao

### 1. NavigateButton — abrir Google Maps/Waze

Criar `apps/motoboy/src/components/delivery/NavigateButton.tsx` (OSD645):

**Props:**
```typescript
interface NavigateButtonProps {
  lat: number
  lng: number
  address: string
}
```

**Comportamento:**
- Botao com icone de navegacao (Navigation2 do lucide)
- Texto: "Navegar"
- Ao clicar: abrir URL de navegacao em nova aba
- URL primaria (Google Maps): `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
- Detectar plataforma via `navigator.userAgent`:
  - Android: tentar `intent://` para Waze, fallback Google Maps URL
  - iOS: tentar `comgooglemaps://` e `waze://`, fallback Google Maps URL
  - Outros: Google Maps URL direto
- Usar `window.open(url, '_blank')`

**Integracao:**
- Exibir na tela de entrega ativa (EntregasPage) abaixo do endereco de destino
- Visivel quando status e "accepted", "picked_up" ou "in_transit"

### 2. DeliveryNotification — som + vibracao

Criar `apps/motoboy/src/components/notifications/DeliveryNotification.tsx` (OSD646):

**Comportamento:**
- Hook `useDeliveryNotification()` (nao componente visual)
- Quando evento `delivery_assigned` chega via SSE:
  - Emitir som: usar `new Audio('/notification.mp3').play()` (arquivo MP3 curto na pasta public)
  - Vibrar: `navigator.vibrate([200, 100, 200])` (vibra-pausa-vibra)
  - Se Notification API disponivel e permissao granted: mostrar notificacao do sistema
    - Titulo: "Nova entrega!"
    - Body: "Pedido #{orderNumber} — {deliveryAddress}"
- Solicitar permissao de Notification no primeiro uso (banner ou prompt automatico ao ficar online)

**Integracao:**
- Chamar no AppShell ou componente root do app motoboy
- Adicionar arquivo `notification.mp3` em `apps/motoboy/public/` (som curto, ~1s, tom neutro)

### 3. DeliveryPreview — info antes de aceitar

Criar `apps/motoboy/src/components/delivery/DeliveryPreview.tsx` (OSD647):

**Props:**
```typescript
interface DeliveryPreviewProps {
  delivery: PendingDelivery  // dados da entrega pendente
}
```

**Comportamento:**
- Card mostrando informacoes ANTES do motoboy aceitar:
  - Endereco de destino (texto)
  - Distancia estimada (km) — calcular Haversine client-side entre pickup e delivery coords
  - Valor estimado (R$) — se `delivery_prices` disponivel no payload, usar. Se nao, chamar GET /api/orders/estimate
  - Mapa mini com rota (linha reta entre pickup e delivery)
- Botoes: "Aceitar" (verde) e "Recusar" (outline/ghost)

**Calculo de distancia client-side:**
```typescript
function haversine(lat1, lng1, lat2, lng2): number // km
```
Usar formula Haversine padrao. Nao chamar API para isso.

**Integracao:**
- Substituir o card de pending delivery atual no EntregasPage
- Manter botoes Accept/Reject com mesma logica (useActiveDelivery)

### 4. StatusContext — contexto visual

Criar `apps/motoboy/src/components/status/StatusContext.tsx` (OSD648):

**Props:**
```typescript
interface StatusContextProps {
  status: CourierStatus
  pendingOrdersCount: number
}
```

**Comportamento:**
- Se online (available): "Voce esta online — {N} entregas disponiveis na regiao"
- Se busy: "Entrega em andamento"
- Se offline: "Fique online para receber entregas"
- Icone contextual e cor de fundo suave
- Mapa com posicao atual do motoboy (mini mapa, ~150px)

**Dados:**
- `pendingOrdersCount`: buscar de `GET /api/orders?status=pending` (apenas count). Ou novo endpoint `GET /api/orders/count?status=pending`.
- Se nao houver endpoint de count, usar o length do array retornado (paginacao pode limitar — aceitar limitacao)

**Integracao:**
- Renderizar no StatusPage abaixo do toggle de status
- Atualizar via react-query (refetch a cada 30s quando online)

### 5. Backend — endpoint de contagem (opcional)

Se necessario, criar rota `GET /api/orders/pending-count` em orders.ts:
- Retorna `{ count: number }` — COUNT orders WHERE status = 'pending' AND company_id = X
- Role check: courier

## Limites

- Nao implementar push notifications via service worker (complexidade alta). Notification API browser e suficiente
- Nao implementar escolha de app de navegacao (UI de selecao). Usar Google Maps como default com deep link detection
- Nao alterar fluxo de accept/reject existente — apenas enriquecer a UI com preview
- Distancia no preview e Haversine (linha reta) — nao e distancia de rota real. Aceitar imprecisao
- Valor estimado pode diferir do valor final (surcharges, distancia real)
- Arquivo de som de notificacao: usar qualquer MP3 curto livre de royalties (~1s)
- Nao implementar seletor de tom de notificacao
