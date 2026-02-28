---
status: current
---

# PRP-004 — App do Lojista

Implementar o frontend do App do Lojista — aplicacao mobile-first PWA para lojistas solicitarem entregas, acompanharem em tempo real e consultarem historico.

## Objetivo

Produzir a aplicacao React + Vite PWA em `apps/lojista/` com todas as paginas, componentes e integracao com backend (REST + SSE) para o perfil `shop`. Foco em criar pedido em poucos cliques e rastrear entrega no mapa.

## Execution Mode

`implementar`

## Contexto

- **PRP-001 e PRP-002 ja executados** — monorepo configurado, schemas Zod em `packages/shared/schemas/`, backend funcional com todas as rotas REST e SSE.
- **PRP-003 ja executado** — Central da Empresa implementada. Usar mesmos padroes de componentes, hooks e integracao SSE ja estabelecidos em `apps/central/`. Reutilizar componentes via copy (nao compartilhados entre apps — cada app tem seus proprios componentes).
- **Placeholder existe** — `apps/lojista/` ja tem Vite + React configurado com porta `${PREFIX}03`.
- **Stack identica** — mesmas bibliotecas do PRP-003 (React 19, Vite 6, shadcn/ui v4, Tailwind 4, react-router 7, @tanstack/react-query 5, ky, react-leaflet 5, react-hook-form 7, vite-plugin-pwa, @supabase/supabase-js).
- **UI Guide** — tokens, componentes e navegacao em `.projeto/wave-1/specs/chegala-ui-guide.md`.

## Especificacao

### 1. Setup de Dependencias

Mesmo conjunto de dependencias do PRP-003. Instalar e configurar com mesmos tokens semanticos do branding Chega.la.

### 2. Layout e Navegacao

Conforme `.projeto/wave-1/specs/chegala-ui-guide.md` secao "Modulos — Navegacao — App do Lojista":

| Item | Rota | Icone |
|------|------|-------|
| Pedidos | / | Package |
| Nova Entrega | /nova | Plus |
| Historico | /historico | Clock |

Layout mobile-first:
- **BottomNav** com 3 itens
- **Header** com logo Chega.la (SVG) + nome do lojista + logout
- Responsivo: no desktop, layout centralizado com max-width

Rota `/login` sem BottomNav — tela de login com email/senha via GoTrue.

### 3. Autenticacao

Mesma estrategia do PRP-003:
- Login via `@supabase/supabase-js` `signInWithPassword`
- AuthProvider com sessao, auto-renovacao JWT, redirect para `/login`
- ky configurado com `Authorization: Bearer {token}`

Requisitos cobertos: OSD001-OSD003, OSD009, OSD010.

### 4. Paginas

**4.1 Pedidos Ativos (/) — US021**

- Lista de pedidos do lojista com status atualizado em tempo real (OSD102)
- Cada card mostra: numero, destinatario, status badge, motoboy (se atribuido)
- Status atualiza via SSE — conectar a `/events/order/{orderId}` para cada pedido ativo
- Clicar no card abre detalhe com:
  - Timeline de eventos (criado, atribuido, coletado, a caminho, entregue) (OSD065)
  - Mapa com posicao do motoboy em tempo real (OSD103) — so visivel quando status >= assigned
  - Botao "Cancelar" em pedidos com status pending ou assigned (OSD105, OSD044)

**4.2 Nova Entrega (/nova) — US020**

- Formulario de criacao de pedido:
  - Endereco de coleta: pre-preenchido com endereco do lojista cadastrado (OSD101)
  - Endereco de entrega: campo de texto (OSD040)
  - Nome do destinatario (OSD040)
  - Telefone do destinatario (OSD040)
  - Observacoes: campo opcional (OSD047)
- Validacao com Zod schema de `packages/shared/schemas/api/orders.ts`
- Tela de confirmacao antes de enviar (US020 criterio "Confirmacao antes de enviar")
- Submit via POST /api/orders
- Apos criacao, redirecionar para lista de pedidos com toast de sucesso
- Pedido aparece na lista com status "pending"

Requisitos cobertos: OSD040, OSD045, OSD047, OSD101.

**4.3 Historico (/historico) — US022**

- Lista de pedidos passados (status: delivered ou cancelled) (OSD104)
- Cada card mostra: numero, data, status final, destinatario
- Clicar abre detalhe com informacoes completas
- Paginacao ou scroll infinito

### 5. Integracao SSE

- Para cada pedido ativo, conectar ao canal `/events/order/{orderId}`
- Autenticar via query param `?token={jwt}` (OSD125)
- Processar eventos:
  - `order_status` → atualizar status do pedido na lista e no detalhe
  - `courier_location` → atualizar posicao no mapa do detalhe
- Reconexao automatica com backoff (OSD124)
- Desconectar de canais de pedidos concluidos/cancelados

Alternativa: conectar ao canal `/events/company/{companyId}` e filtrar eventos relevantes no client (mais simples, menos conexoes). Decisao: usar canal company — uma unica conexao SSE.

### 6. Componentes

Reutilizar padroes visuais estabelecidos no PRP-003 (recriar no app, nao importar):

- `AppShell` — layout com header + bottomnav + content (mobile-first)
- `OrderCard` — card de pedido com status badge
- `StatusBadge` — badges conforme ui-guide
- `MapView` — mapa Leaflet para rastreamento
- `CourierMarker` — marcador do motoboy
- `OrderTimeline` — timeline de eventos da entrega
- `ConfirmDialog` — dialogo de confirmacao (cancelar pedido, confirmar envio)
- Estados: `EmptyState`, `LoadingSkeleton`, `ErrorAlert`

### 7. PWA

- `vite-plugin-pwa` com manifest: nome "Chega.la Lojista", icone, cores do branding (RNF003)
- Instalavel como app na home screen do celular

### 8. Responsividade e Localizacao

- Mobile-first: tudo funcional em 320px+
- Desktop: layout centralizado, max-width 480px no conteudo principal
- Toda interface em pt-BR (RNF012)

## Limites

- **Nao alterar o backend** (`apps/backbone/`).
- **Nao alterar schemas compartilhados** (`packages/shared/schemas/`).
- **Nao alterar a Central** (`apps/central/`).
- **Nao implementar funcionalidades de operator** — este app e exclusivo para perfil shop.
- **Nao implementar funcionalidades de motoboy** — escopo do PRP-005.
- **Nao implementar geocoding ou autocomplete de endereco** — endereco e texto livre.
- **Nao implementar filtro por periodo no historico** — lista simples ordenada por data.
- **Nao criar componentes compartilhados entre apps** — cada app tem seus proprios componentes.
