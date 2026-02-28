---
status: current
---

# PRP-003 — Central da Empresa (Operador)

Implementar o frontend da Central da Empresa — painel web desktop-first para o operador gerenciar pedidos, motoboys, lojistas e acompanhar a operacao em tempo real.

## Objetivo

Produzir a aplicacao React + Vite PWA em `apps/central/` com todas as paginas, componentes e integracao com backend (REST + SSE) para o perfil `operator`. Dashboard com pedidos ativos, mapa de motoboys, gestao de lojistas e motoboys.

## Execution Mode

`implementar`

## Contexto

- **PRP-001 e PRP-002 ja executados** — monorepo configurado, schemas Zod em `packages/shared/schemas/`, backend funcional em `apps/backbone/` com todas as rotas REST e SSE.
- **Placeholder existe** — `apps/central/` ja tem Vite + React configurado com porta `${PREFIX}02`, tsconfig referenciando shared schemas.
- **Stack de frontend decidida** — React 19, Vite 6, shadcn/ui v4, Tailwind CSS 4, react-router 7, @tanstack/react-query 5, ky (HTTP client), react-leaflet 5, react-hook-form 7. Detalhes em `.projeto/wave-1/specs/chegala-design.md` secao "Bibliotecas".
- **UI Guide** — tokens semanticos, componentes, padroes de pagina e navegacao definidos em `.projeto/wave-1/specs/chegala-ui-guide.md`.
- **Branding** — cores #222e6e (primary), #1dace7 (secondary), #fca322 (accent). Logo SVG em `.projeto/2-brand/`. Detalhes em `.projeto/wave-1/specs/chegala-design.md` secao "Branding".
- **GoTrue** — autenticacao via `@supabase/supabase-js`. Client faz login direto com GoTrue, recebe JWT, envia em todas as requisicoes ao backbone.

## Especificacao

### 1. Setup de Dependencias

Instalar e configurar:
- shadcn/ui v4 + Tailwind CSS 4 com tokens semanticos conforme `.projeto/wave-1/specs/chegala-ui-guide.md` secao "Tokens Semanticos"
- react-router 7 com rotas conforme tabela de navegacao abaixo
- @tanstack/react-query 5 para gerenciamento de estado server
- ky para HTTP client (configurar base URL para backbone)
- react-leaflet 5 + leaflet para mapas
- react-hook-form 7 + @hookform/resolvers para formularios com validacao Zod
- vite-plugin-pwa para PWA (RNF003)
- @supabase/supabase-js para auth

### 2. Layout e Navegacao

Conforme `.projeto/wave-1/specs/chegala-ui-guide.md` secao "Modulos — Navegacao":

| Item | Rota | Icone |
|------|------|-------|
| Dashboard | / | LayoutDashboard |
| Pedidos | /pedidos | Package |
| Motoboys | /motoboys | Bike |
| Lojistas | /lojistas | Store |
| Mapa | /mapa | Map |

Layout desktop-first:
- **Sidebar fixa** no desktop (>= 1024px) com logo Chega.la (SVG de `.projeto/2-brand/`) + itens de navegacao
- **Sidebar colapsavel** no tablet (768-1024px)
- **BottomNav** no mobile (< 768px)
- **Header** com nome do usuario e logout

Rota `/login` sem sidebar — tela de login com email/senha via GoTrue.

### 3. Autenticacao

- Tela de login: email + senha, submit via `@supabase/supabase-js` `signInWithPassword`
- Armazenar sessao no Supabase client (auto-renova JWT — OSD010)
- AuthProvider/Context que:
  - Verifica sessao ativa ao carregar
  - Redireciona para `/login` se nao autenticado
  - Disponibiliza `user`, `companyId`, `role` para toda a app
  - Expoe funcao de logout
- Configurar ky com interceptor que adiciona `Authorization: Bearer {token}` em toda requisicao

Requisitos cobertos: OSD001, OSD002, OSD003, OSD009, OSD010.

### 4. Paginas

**4.1 Dashboard (/) — US004**

- Contagem de pedidos do dia: total, em andamento, concluidos (OSD142)
- Lista de pedidos ativos com status atualizado em tempo real via SSE (OSD140)
- Mapa com motoboys disponiveis/ocupados (OSD141)
- Pedidos atualizam automaticamente via SSE no canal `/events/company/{companyId}`

**4.2 Pedidos (/pedidos) — US001, US004**

- Lista de pedidos com: numero, lojista, status, motoboy atribuido
- Filtro por status (badges clicaveis conforme ui-guide secao "Padroes de Pagina — Lista com Filtro")
- Botao "Novo Pedido" abre formulario:
  - Campos: endereco de coleta, endereco de entrega, nome destinatario, telefone destinatario, observacoes (OSD040, OSD047)
  - Validacao com Zod schema de `packages/shared/schemas/api/orders.ts`
  - Submit via POST /api/orders
- Clicar no pedido abre detalhe com timeline de eventos (OSD065)
- Botao "Atribuir Motoboy" no pedido pendente:
  - Lista motoboys disponiveis (OSD083)
  - Submit via POST /api/orders/:id/assign (OSD060)
- Botao "Cancelar" em pedidos com status < picked_up (OSD044)
- Status atualiza em tempo real via SSE

Requisitos cobertos: OSD040-OSD049, OSD060.

**4.3 Motoboys (/motoboys) — US005**

- Lista de motoboys com: nome, telefone, status (badge colorido), entregas concluidas
- Botao "Novo Motoboy" abre formulario: nome, telefone, foto, email para convite (OSD080, OSD006)
- Toggle ativar/desativar motoboy (OSD086)
- Detalhe do motoboy com historico de entregas (OSD085)

**4.4 Lojistas (/lojistas) — US006**

- Lista de lojistas com: nome fantasia, telefone, endereco, pedidos recentes
- Botao "Novo Lojista" abre formulario: nome, telefone, endereco, email para convite (OSD100, OSD006, OSD022)
- Detalhe do lojista com lista de pedidos

**4.5 Mapa (/mapa) — US003**

- Mapa Leaflet em tela cheia com marcadores de motoboys (OSD083)
- Marcadores diferenciados por status: available (verde/secondary), busy (laranja/accent) (OSD141)
- Posicao atualiza em tempo real via SSE (courier_location events)
- Clicar no marcador mostra popup com nome do motoboy e entrega atual
- Tile OpenStreetMap (sem custo de API)

### 5. Integracao SSE

- Conectar ao canal `/events/company/{companyId}` ao carregar a app
- Autenticar SSE via query param `?token={jwt}` (OSD125)
- Processar eventos tipados:
  - `order_created` → adicionar pedido a lista
  - `order_status` → atualizar status do pedido
  - `courier_location` → atualizar posicao no mapa
  - `courier_status` → atualizar badge de status
- Reconexao automatica com backoff exponencial (OSD124)
- Hook `useSSE(channel)` reutilizavel

### 6. Componentes Compartilhados

Conforme `.projeto/wave-1/specs/chegala-ui-guide.md`:

- `AppShell` — layout com header + sidebar/bottomnav + content
- `OrderCard` — card de pedido com numero, status badge, lojista, motoboy
- `StatusBadge` — badge colorido conforme tabela de status badges no ui-guide
- `MapView` — wrapper do Leaflet com tiles OSM
- `CourierMarker` — marcador de motoboy diferenciado por status
- `EmptyState` — estado vazio com icone, titulo, descricao, acao
- `LoadingSkeleton` — placeholder de carregamento

### 7. PWA

- Configurar `vite-plugin-pwa` com manifest: nome "Chega.la Central", icone do logo, cores do branding (RNF003)
- Service worker para cache basico de assets

### 8. Responsividade

Conforme `.projeto/wave-1/specs/chegala-ui-guide.md` secao "Responsividade":
- < 768px: BottomNav, cards empilhados, formularios full-width
- >= 768px: Sidebar colapsavel, cards em grid 2 colunas
- >= 1024px: Sidebar fixa, mapa + lista lado a lado

Requisitos cobertos: RNF013.

### 9. Localizacao

Toda a interface em pt-BR (RNF012). Labels, mensagens de erro, placeholders — tudo em portugues.

## Limites

- **Nao alterar o backend** (`apps/backbone/`) — consumir a API como esta.
- **Nao alterar schemas compartilhados** (`packages/shared/schemas/`).
- **Nao implementar upload de foto** — campo de foto do motoboy aceita URL manual por enquanto.
- **Nao implementar geocoding** — enderecos sao texto livre, coordenadas manuais ou omitidas.
- **Nao implementar notificacoes push** — apenas SSE em tempo real.
- **Nao criar componentes para perfis lojista ou motoboy** — este PRP e exclusivo para o perfil operator.
- **Nao implementar configuracao de empresa** (logo upload, CNPJ) — sera feito em wave futura.
- **Nao adicionar dark mode** — apenas light mode com tokens semanticos do branding.
