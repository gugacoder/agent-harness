# Chega.la - Design e Arquitetura Wave 5

Extensoes de arquitetura para a Wave 5 — geocoding, autocomplete de enderecos, CRUD completo, tracking confiavel e quality pass de interfaces. Incremental sobre waves anteriores — stack, monorepo, convencoes e autenticacao permanecem inalterados.

---

## Novas Dependencias

| Funcao | Biblioteca | Versao | Modulo |
|--------|------------|--------|--------|
| Autocomplete UI | cmdk (Command Menu) | ^1 | central, lojista |
| Debounce | lodash.debounce (ja instalado) | — | central, lojista |

Servicos externos (sem biblioteca — fetch direto):

| Servico | Uso | Custo |
|---------|-----|-------|
| ViaCEP / BrasilAPI | Preenchimento por CEP | Gratuito |
| Nominatim (OSM) | Geocoding textual (busca → coordenadas) | Gratuito (self-hosted ou public, 1 req/s) |
| HERE Geocoding | Geocoding textual — fallback | 250K req/mes gratis |

---

## Estrutura do Monorepo (extensoes Wave 5)

```
apps/
  backbone/
    src/
      routes/
        saved-addresses.ts    <- CRUD enderecos salvos
        geocoding.ts          <- proxy para geocoding (Nominatim/HERE)
      services/
        geocoding.service.ts  <- ViaCEP + Nominatim + HERE
        address.service.ts    <- auto-save, favoritos, busca

  central/
    src/
      pages/
        lojistas/
          [id]/               <- detalhes da loja (nova)
          editar/[id]/        <- edicao de loja (nova)
        motoboys/
          [id]/               <- detalhes do motoboy (nova)
          editar/[id]/        <- edicao de motoboy (nova)
        enderecos/            <- gestao de enderecos (nova)
      components/
        address/
          AddressAutocomplete.tsx  <- componente de autocomplete reutilizavel
          AddressPinDrop.tsx       <- mapa com pin arrastavel
          SavedAddressPicker.tsx   <- dropdown de enderecos salvos
        shops/
          ShopDetailView.tsx       <- detalhes da loja
          ShopEditForm.tsx         <- formulario de edicao
        couriers/
          CourierDetailView.tsx    <- detalhes do motoboy
          CourierEditForm.tsx      <- formulario de edicao
          CourierGpsBadge.tsx      <- badge de qualidade GPS
        orders/
          OrderTimeline.tsx        <- timeline visual do pedido
          BulkAssignDialog.tsx     <- modal de atribuicao em lote
        dashboard/
          TodayCards.tsx           <- cards de metricas em tempo real

  lojista/
    src/
      pages/
        enderecos/            <- "Meus Enderecos" (nova)
      components/
        address/
          AddressAutocomplete.tsx  <- (shared ou duplicado)
          AddressPinDrop.tsx
          SavedAddressPicker.tsx
        orders/
          CostEstimate.tsx         <- estimativa de custo antes de confirmar
          OrderDetailView.tsx      <- detalhes com timeline e POD
          OrderHistoryFilters.tsx  <- filtros de historico

  motoboy/
    src/
      components/
        delivery/
          NavigateButton.tsx       <- botao "Navegar" (Google Maps/Waze)
          DeliveryPreview.tsx      <- distancia + valor antes de aceitar
        status/
          GpsBanner.tsx            <- banner de GPS desativado
          StatusContext.tsx         <- contexto visual ("N entregas disponiveis")
        notifications/
          DeliveryNotification.tsx <- som + vibracao

packages/
  shared/
    schemas/
      entities/
        saved-address.ts      <- SavedAddressSchema
      api/
        saved-addresses.ts    <- request/response schemas
        geocoding.ts          <- GeocodingResultSchema
```

---

## Comunicacao (extensoes Wave 5)

### REST — Novas Rotas

#### Enderecos Salvos

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/saved-addresses | Listar enderecos salvos do usuario autenticado |
| POST | /api/saved-addresses | Criar endereco salvo |
| PATCH | /api/saved-addresses/:id | Atualizar endereco (label, favorito, dados) |
| DELETE | /api/saved-addresses/:id | Remover endereco salvo |

#### Geocoding (proxy)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/geocoding/search?q={query} | Busca textual de enderecos (proxy para Nominatim/HERE) |
| GET | /api/geocoding/reverse?lat={lat}&lng={lng} | Geocoding reverso (coordenadas → endereco) |
| GET | /api/geocoding/cep/{cep} | Busca por CEP (proxy para ViaCEP/BrasilAPI) |

#### Lojas (extensoes)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/shops/:id | Detalhes da loja (com resumo de atividade) |
| PATCH | /api/shops/:id | Atualizar dados da loja |
| PATCH | /api/shops/:id/status | Ativar/desativar loja |
| GET | /api/shops/:id/orders | Historico de pedidos da loja (paginado, ultimos 30 dias) |
| GET | /api/shops/:id/financial-summary | Resumo financeiro (faturado, pendente, ultimo pgto) |

#### Motoboys (extensoes)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/couriers/:id | Detalhes do motoboy (com metricas) |
| PATCH | /api/couriers/:id | Atualizar dados do motoboy |
| PATCH | /api/couriers/:id/status | Ativar/desativar motoboy |
| GET | /api/couriers/:id/deliveries | Historico de entregas (paginado, ultimos 30 dias) |
| GET | /api/couriers/:id/metrics | Metricas: entregas hoje/mes, tempo medio, taxa conclusao |

#### Pedidos (extensoes)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/orders/:id/timeline | Timeline de eventos do pedido |
| POST | /api/orders/bulk-assign | Atribuir multiplos pedidos ao mesmo motoboy |
| GET | /api/orders/estimate?pickup_lat=X&pickup_lng=X&delivery_lat=X&delivery_lng=X | Estimativa de custo |

#### Dashboard (extensoes)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/analytics/today | Metricas do dia: entregas, motoboys online, pendentes |

---

## Fluxo — Autocomplete de Endereco

```
Usuario digita no campo de endereco
   |
   |-- Debounce 300ms
   |
   |-- Detectar tipo de input:
   |     CEP (8 digitos)? → GET /api/geocoding/cep/{cep}
   |     Texto (>= 3 chars)? → GET /api/geocoding/search?q={query}
   |
   |-- Backend resolve:
   |     CEP → ViaCEP → BrasilAPI (fallback)
   |     Texto → Nominatim → HERE (fallback)
   |
   |-- Retornar lista de sugestoes:
   |     [{ address, lat, lng, type }]
   |
   |-- Frontend exibe dropdown com sugestoes
   |
   |-- Usuario seleciona:
   |     → Preencher campos de endereco + lat/lng
   |     → Centralizar mapa + zoom 17
   |
   |-- OU usuario usa pin drop:
   |     → Arrastar marcador no mapa
   |     → GET /api/geocoding/reverse?lat=X&lng=Y
   |     → Preencher campo de endereco
```

---

## Fluxo — Auto-save de Endereco

```
Pedido criado com sucesso (POST /api/orders)
   |
   |-- Verificar se endereco de destino ja existe nos salvos:
   |     WHERE profile_id = X AND address = Y
   |
   |-- Se existe:
   |     → Atualizar use_count + 1, last_used_at = now()
   |
   |-- Se nao existe:
   |     → Contar enderecos nao-favoritos do perfil
   |     → Se >= 10: remover o mais antigo nao-favorito (FIFO)
   |     → Criar saved_address com use_count = 1
```

---

## Fluxo — Tracking Motoboy (melhorias)

```
Motoboy muda status para "online"
   |
   |-- Enviar localizacao IMEDIATA (nao esperar intervalo)
   |
   |-- Iniciar intervalo de 15s (era 30s)
   |
   Central recebe localizacao via SSE
   |
   |-- Atualizar marcador no mapa
   |-- Calcular badge GPS:
   |     delta = now() - recorded_at
   |     < 1 min → verde
   |     1-5 min → amarelo
   |     > 5 min → vermelho
   |     sem dados → cinza
   |
   |-- Stale cleanup (a cada 30s):
   |     Remover marcadores com recorded_at > 10 min
   |
   |-- Auto-fit bounds:
   |     Se novo motoboy aparece fora dos bounds atuais → fitBounds()
```

---

## Fluxo — Navegacao para Endereco (Motoboy)

```
Motoboy toca "Navegar"
   |
   |-- Construir URL de navegacao:
   |     Google Maps: https://www.google.com/maps/dir/?api=1&destination={lat},{lng}
   |     Waze: https://waze.com/ul?ll={lat},{lng}&navigate=yes
   |
   |-- Detectar plataforma:
   |     Android → intent:// com fallback para URL
   |     iOS → universal link com fallback para URL
   |     Web → abrir URL em nova aba
   |
   |-- window.open(url, '_blank')
```

---

## Navegacao (extensoes Wave 5)

### Central da Empresa

| Item | Rota | Icone | Novo? |
|------|------|-------|-------|
| Dashboard | / | LayoutDashboard | Extensao (cards "Hoje") |
| Pedidos | /pedidos | Package | Extensao (timeline, bulk assign) |
| Motoboys | /motoboys | Bike | Extensao (CRUD completo) |
| Motoboy Detalhes | /motoboys/:id | — | **Novo** |
| Lojistas | /lojistas | Store | Extensao (CRUD completo) |
| Loja Detalhes | /lojistas/:id | — | **Novo** |
| Mapa | /mapa | Map | Extensao (GPS badge, stale cleanup) |
| **Enderecos** | **/enderecos** | **MapPin** | **Novo** |

### App do Lojista

| Item | Rota | Icone | Novo? |
|------|------|-------|-------|
| Pedidos | / | Package | — |
| Nova Entrega | /nova | Plus | Extensao (autocomplete, estimativa) |
| Historico | /historico | Clock | Extensao (filtros) |
| **Meus Enderecos** | **/enderecos** | **MapPin** | **Novo** |

### App do Motoboy

| Item | Rota | Icone | Novo? |
|------|------|-------|-------|
| Entregas | / | Package | Extensao (preview, navegar) |
| Historico | /historico | Clock | — |
| Status | /status | Circle | Extensao (contexto visual) |

---

## Decisoes Tecnicas Vinculantes

| Decisao | Justificativa |
|---------|---------------|
| Geocoding via proxy no backend | Nao expor chaves de API no frontend. Rate limiting controlado no servidor. Cache possivel. |
| ViaCEP como camada primaria para CEP | Gratuito, rapido, sem limite pratico para volume brasileiro. |
| Nominatim como geocoding primario | Gratuito, sem vendor lock-in. HERE como fallback se rate limit atingido. |
| Intervalo GPS de 15s (era 30s) | Melhor experiencia no mapa da Central. Impacto em bateria aceitavel para motoboys profissionais. |
| Stale marker cleanup a cada 30s | Evita motoboys "fantasma" no mapa. Threshold de 10 min e conservador. |
| Auto-save de enderecos no backend | Garante consistencia. Lojista nao precisa fazer nada — enderecos salvos automaticamente. |
| Limite de 10 enderecos recentes (nao-favoritos) | Evita acumulo infinito. Favoritos nao contam no limite. FIFO para rotacao. |
| cmdk para autocomplete UI | Componente acessivel, keyboard-friendly, composavel, leve. Compativel com shadcn. |

---

## Rastreabilidade

| Componente | Rotas API | Requisitos |
|------------|-----------|------------|
| AddressAutocomplete | /api/geocoding/* | OSD501-OSD512 |
| SavedAddressPicker | /api/saved-addresses | OSD530-OSD538 |
| ShopDetailView | /api/shops/:id, /api/shops/:id/orders | OSD550-OSD556 |
| CourierDetailView | /api/couriers/:id, /api/couriers/:id/metrics | OSD570-OSD578 |
| CourierGpsBadge | — (calculo client-side) | OSD590, OSD594 |
| TodayCards | /api/analytics/today | OSD610 |
| OrderTimeline | /api/orders/:id/timeline | OSD611, OSD627 |
| BulkAssignDialog | /api/orders/bulk-assign | OSD612 |
| CostEstimate | /api/orders/estimate | OSD625 |
| NavigateButton | — (URL construction) | OSD645 |
| DeliveryNotification | — (Notification API) | OSD646 |
| DeliveryPreview | — (dados via SSE/REST) | OSD647 |
