---
status: current
---

# PRP-005 — App do Motoboy

Implementar o frontend do App do Motoboy — aplicacao mobile-first PWA para motoboys receberem entregas, atualizarem status, compartilharem localizacao e consultarem historico.

## Objetivo

Produzir a aplicacao React + Vite PWA em `apps/motoboy/` com todas as paginas, componentes e integracao com backend (REST + SSE) para o perfil `courier`. Foco em receber notificacao de entrega, aceitar/recusar, atualizar status por etapa e compartilhar GPS automaticamente.

## Execution Mode

`implementar`

## Contexto

- **PRP-001 e PRP-002 ja executados** — monorepo configurado, schemas Zod em `packages/shared/schemas/`, backend funcional com todas as rotas REST e SSE.
- **PRP-003 e PRP-004 ja executados** — Central e App do Lojista implementados. Usar mesmos padroes de componentes, hooks e integracao SSE ja estabelecidos. Recriar componentes no app (nao importar de outros apps).
- **Placeholder existe** — `apps/motoboy/` ja tem Vite + React configurado com porta `${PREFIX}04`.
- **Stack identica** — mesmas bibliotecas dos PRPs anteriores (React 19, Vite 6, shadcn/ui v4, Tailwind 4, react-router 7, @tanstack/react-query 5, ky, react-hook-form 7, vite-plugin-pwa, @supabase/supabase-js).
- **UI Guide** — tokens, componentes e navegacao em `.projeto/wave-1/specs/chegala-ui-guide.md`.
- **Este app e o mais critico em UX mobile** — motoboy usa com uma mao enquanto dirige. Botoes grandes, acoes claras, minimo de toques.

## Especificacao

### 1. Setup de Dependencias

Mesmo conjunto de dependencias dos PRPs anteriores. Instalar e configurar com tokens semanticos do branding. **Nao instalar react-leaflet** — motoboy nao precisa de mapa (quem ve o mapa e o operador e o lojista).

### 2. Layout e Navegacao

Conforme `.projeto/wave-1/specs/chegala-ui-guide.md` secao "Modulos — Navegacao — App do Motoboy":

| Item | Rota | Icone |
|------|------|-------|
| Entregas | / | Package |
| Historico | /historico | Clock |
| Status | /status | Circle |

Layout mobile-first:
- **BottomNav** com 3 itens
- **Header** com logo Chega.la (SVG) + nome do motoboy + status badge (available/busy/offline)
- Tudo otimizado para toque com uma mao — botoes minimo 48px de altura

Rota `/login` sem BottomNav.

### 3. Autenticacao

Mesma estrategia dos PRPs anteriores:
- Login via `@supabase/supabase-js` `signInWithPassword`
- AuthProvider com sessao, auto-renovacao JWT, redirect para `/login`
- ky configurado com `Authorization: Bearer {token}`

### 4. Paginas

**4.1 Entregas (/) — US040, US041**

Duas secoes:

**Entrega nova (notificacao):**
- Quando chega evento `delivery_assigned` via SSE, exibir card proeminente com:
  - Endereco de coleta, endereco de entrega, observacoes (US040)
  - Botoes grandes: "Aceitar" (verde/primary) e "Recusar" (vermelho/destructive) (OSD061)
- Aceitar: POST /api/deliveries/:id/accept → muda para entrega ativa
- Recusar: POST /api/deliveries/:id/reject → card desaparece, central notificada

**Entrega ativa:**
- Card com detalhes da entrega atual (OSD061)
- Botao de acao por etapa, um de cada vez, grande e claro (US041):
  - Status `accepted` → botao "Coletei" (picked_up)
  - Status `picked_up` → botao "A caminho" (in_transit)
  - Status `in_transit` → botao "Entreguei" (delivered)
- Cada toque: PATCH /api/orders/:id/status com novo status
- Validacao de transicao no client (nao mostrar botao de etapa futura) (OSD043)
- Timeline de eventos visivel abaixo do card (OSD065)
- Timestamp registrado automaticamente (OSD042)

**Sem entrega ativa:**
- EmptyState: "Nenhuma entrega no momento. Mantenha-se disponivel."

Requisitos cobertos: OSD041-OSD045, OSD061, OSD065, OSD084.

**4.2 Historico (/historico) — US044**

- Lista de entregas realizadas: data, lojista/endereco, status final, tempo gasto (OSD085)
- Contagem de entregas do dia no topo
- Ordenado por data decrescente

**4.3 Status (/status) — US043**

- Toggle de disponibilidade: Available ↔ Offline (OSD081)
  - Toggle grande e visivel
  - PATCH /api/couriers/:id/status ao alternar
  - Status "busy" e automatico (nao aparece como opcao manual — definido pelo backend quando tem entrega ativa)
- Status atual exibido no header em todas as paginas
- Informacao: "Quando voce esta disponivel, voce recebe novas entregas"

### 5. Compartilhamento de Localizacao (GPS) — US042

- Solicitar permissao de localizacao ao primeiro uso (`navigator.geolocation`)
- Quando status `available`: enviar localizacao a cada 30 segundos via POST /api/couriers/:id/location (OSD082)
- Quando em entrega ativa: enviar a cada 15 segundos (OSD062)
- Envio continua em background enquanto app esta aberto
- Se permissao negada: exibir alerta explicando a necessidade + link para configuracoes do navegador
- Dados enviados: lat, lng, accuracy (OSD062, OSD082)
- **Implementar como hook `useLocationSharing`**:
  - Recebe `status` (available/busy/offline) e `hasActiveDelivery`
  - Controla intervalo de envio conforme regras
  - Para de enviar quando offline
  - Retorna estado: sharing/paused/denied

Requisitos cobertos: OSD062, OSD082, OSD122.

### 6. Integracao SSE

- Conectar ao canal `/events/courier/{courierId}` ao carregar a app
- Autenticar via query param `?token={jwt}` (OSD125)
- Processar eventos:
  - `delivery_assigned` → exibir card de nova entrega com aceitar/recusar (OSD084)
  - `delivery_cancelled` → remover entrega ativa, exibir toast informativo
- Reconexao automatica com backoff (OSD124)
- Hook `useSSE(channel)` reutilizavel (mesmo padrao dos outros apps)

### 7. Componentes

- `AppShell` — layout mobile-first com header + bottomnav
- `DeliveryCard` — card de entrega com enderecos e status
- `DeliveryNotification` — card proeminente de nova entrega (aceitar/recusar)
- `ActionButton` — botao grande de acao por etapa (coletei, a caminho, entreguei)
- `StatusToggle` — toggle de disponibilidade (available/offline)
- `DeliveryTimeline` — timeline de eventos da entrega
- `StatusBadge` — badge de status conforme ui-guide
- Estados: `EmptyState`, `LoadingSkeleton`, `ErrorAlert`

### 8. PWA

- `vite-plugin-pwa` com manifest: nome "Chega.la Motoboy", icone, cores do branding (RNF003)
- Instalavel como app na home screen
- **Importante**: o app deve pedir permissao de localizacao apos instalacao, nao no primeiro acesso web

### 9. Responsividade e Localizacao

- Mobile-first: tudo funcional em 320px+. Botoes de acao minimo 48px altura, touch-friendly.
- Desktop: layout centralizado, max-width 480px
- Toda interface em pt-BR (RNF012)

## Limites

- **Nao alterar o backend** (`apps/backbone/`).
- **Nao alterar schemas compartilhados** (`packages/shared/schemas/`).
- **Nao alterar Central ou App do Lojista**.
- **Nao implementar mapa** — motoboy nao precisa ver mapa. Quem ve mapa e operador e lojista.
- **Nao implementar navegacao/roteirizacao** — fora do escopo da Wave 1 (D-016, score 5).
- **Nao implementar extrato financeiro** — fora do escopo da Wave 1 (D-014, G-009).
- **Nao implementar notificacoes push nativas** — usar apenas SSE. Push sera wave futura.
- **Nao implementar tracking em background** (quando app fechado) — localizacao so e enviada com app aberto. Background tracking sera wave futura.
- **Nao criar componentes compartilhados entre apps** — cada app tem seus proprios.
