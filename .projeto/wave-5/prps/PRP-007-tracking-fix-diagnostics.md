---
status: current
---

# PRP-007 — Tracking Fix + Diagnostico GPS

## Objetivo

Tornar o tracking de motoboys confiavel: reduzir intervalo GPS, enviar localizacao imediata ao ficar online, adicionar badge de qualidade GPS na Central, banner de alerta no app motoboy, e limpeza de marcadores stale.

## Execution Mode

`implementar`

## Contexto

**useLocationSharing** (`apps/motoboy/src/hooks/useLocationSharing.ts`, ~113 linhas): envia localizacao via `POST /api/couriers/{id}/location` em intervalos de 30s (available) e 15s (com entrega ativa). Estado: `paused | sharing | denied`. Nao envia localizacao imediata ao mudar status. Nao tem banner de GPS negado.

**MapaPage** (`apps/central/src/pages/MapaPage.tsx`, ~200 linhas): exibe motoboys no mapa usando dados de localizacao recebidos via SSE. Nao tem badge de qualidade GPS, nao remove stale markers, nao faz auto-fit bounds.

**SSE events:** O canal `company/{companyId}` recebe `courier_location` com `{ courierId, lat, lng, recorded_at }`.

**StatusPage** (`apps/motoboy/src/pages/StatusPage.tsx`): pagina de status do motoboy, toggle online/offline.

## Especificacao

### 1. Motoboy — useLocationSharing

Modificar `apps/motoboy/src/hooks/useLocationSharing.ts`:

**Intervalos (OSD593):**
- Quando `status = "available"`: intervalo de **15s** (era 30s)
- Quando `status = "busy"` (entrega ativa): manter **15s**
- Quando `status = "offline"`: nao enviar

**Envio imediato ao ficar online (OSD592):**
- Detectar transicao de status para "available" (via useEffect no status)
- Ao transicionar: chamar `getCurrentPosition()` imediatamente e enviar
- Nao esperar o proximo intervalo

**Estado "denied" mais informativo:**
- Ao receber `PermissionDeniedError`: setar estado para `denied` com campo `reason: "permission_denied"`
- Ao receber `PositionUnavailableError`: setar estado para `denied` com `reason: "unavailable"`

### 2. Motoboy — GpsBanner

Criar `apps/motoboy/src/components/status/GpsBanner.tsx` (OSD591):

**Props:** `{ state: LocationState }`

**Comportamento:**
- Se `state = "denied"`: banner fixo vermelho no topo do app (position sticky, z-index alto)
- Texto: "Ative sua localizacao para receber entregas"
- Botao: "Como ativar" (link para settings do navegador ou instrucoes)
- Se `state = "sharing"` ou `state = "paused"` (por outro motivo): nao exibir

**Integracao:**
- Renderizar no layout principal do app motoboy (AppShell ou equivalente)
- Acima do conteudo da pagina, abaixo do header

### 3. Central — CourierGpsBadge

Criar `apps/central/src/components/couriers/CourierGpsBadge.tsx` (OSD590):

**Props:** `{ lastRecordedAt: string | null }`

**Comportamento:**
- Calcular delta: `now() - lastRecordedAt`
- Exibir badge colorido:
  - Verde (bg-green-500): delta < 1 minuto
  - Amarelo (bg-yellow-500): delta entre 1 e 5 minutos
  - Vermelho (bg-red-500): delta > 5 minutos
  - Cinza (bg-gray-400): `lastRecordedAt` nulo (nunca recebeu localizacao)
- Tooltip com texto explicativo: "GPS ativo", "GPS intermitente", "GPS inativo", "Sem dados"

**Integracao:**
- Exibir na lista de motoboys (MotoboysPage) ao lado do nome
- Exibir na tela de detalhes do motoboy (CourierDetailView do PRP-006)
- Exibir no mapa (popup do marcador)

### 4. Central — MapaPage enhancements

Modificar `apps/central/src/pages/MapaPage.tsx`:

**Stale marker cleanup (OSD594):**
- A cada 30 segundos, iterar sobre marcadores no mapa
- Remover marcadores cujo `recorded_at` e > 10 minutos atras
- Implementar via `setInterval` dentro de useEffect

**Auto-fit bounds (OSD595):**
- Quando um novo motoboy aparece (courier_location de courierId nao presente no mapa):
  - Verificar se posicao esta dentro dos bounds atuais
  - Se fora: chamar `map.fitBounds()` incluindo todos os marcadores
- Nao fazer auto-fit se usuario fez zoom/pan manual (flag `userInteracted`)

**GPS badge nos marcadores:**
- Popup do marcador: incluir CourierGpsBadge + nome + status

### 5. Central — Dashboard hook (preparacao)

No hook que alimenta o mapa com dados de motoboys, garantir que `recorded_at` e propagado para os componentes. Se atualmente so propaga lat/lng, adicionar `recorded_at` ao estado.

## Limites

- Nao alterar endpoints do backend (POST /couriers/:id/location ja funciona)
- Nao alterar a infraestrutura SSE (eventos ja carregam recorded_at)
- Nao implementar push notifications neste PRP (PRP-010 cobre notificacoes sonoras)
- Nao alterar o padrao de heartbeat SSE (30s)
- O flag `userInteracted` para auto-fit e best-effort — se complexo, simplesmente nao fazer auto-fit apos interacao por 60 segundos
