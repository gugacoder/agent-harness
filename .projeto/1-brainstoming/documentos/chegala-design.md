# Chega.la - Design e Arquitetura

Decisoes tecnicas vinculantes para o ecossistema Chega.la. Tres modulos (Central, Lojista, Motoboy) + backbone API, sincronizados em tempo real via SSE.

---

## Stack Principal

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| Banco | PostgreSQL 15 (Supabase Docker) | Battle-tested para apps transacionais. Schema Drizzle no repo, migrations derivadas. |
| ORM | Drizzle | TypeScript-first. Mapeamento direto Zod via drizzle-zod. |
| Auth | GoTrue (Supabase) | JWT centralizado. @supabase/supabase-js nos clients. Sem reinventar. |
| Storage | Supabase Storage | Upload de arquivos (fotos, comprovantes). Integrado ao compose. |
| API | Hono + @hono/zod-openapi | Rotas tipadas, OpenAPI gerado, validacao automatica. SSE nativo. |
| Real-time | SSE nativo (Hono) | Unidirecional server→client. Sem polling. Canais por recurso. |
| Schemas | Zod (packages/shared/) | Source of truth. Todos os componentes importam daqui. |
| Frontend | React + Vite | SPA/PWA. Compativel com Zod schemas compartilhados. |
| Estilizacao | Tailwind CSS + shadcn/ui | Componentes acessiveis, design system consistente, theme customizavel. |
| Forms | React Hook Form + Zod resolver | Validacao client-side com os mesmos schemas do backend. |
| Mapas | Leaflet ou Mapbox GL | Visualizacao de motoboys, rotas e rastreamento em tempo real. |
| Reverse Proxy | Caddy | Unifica rotas em porta unica. TLS automatico. |
| Gateway | Kong | API gateway do Supabase. JWT validation. |
| Cache | Redis 7 | Sessions, rate limiting, pub/sub interno. |
| WhatsApp | Evolution API | Integracao WhatsApp para IA progressiva. |
| Workflows | n8n | Automacao de processos (notificacoes, integracao). |
| Transcricao | Whisper (faster-whisper) | Transcricao de audio de mensagens de voz. |
| Logs | MongoDB 7 | Audit logs e operational logging. |
| Busca | Meilisearch | Busca full-text de pedidos, lojistas, motoboys. |

---

## Estrutura do Monorepo

```
apps/
  backbone/                 ← API REST + SSE (Hono + Drizzle)
    src/
      routes/               ← Rotas Hono com @hono/zod-openapi
      services/             ← Logica de negocio
      middleware/           ← Auth, rate-limit, multi-tenancy
      sse/                  ← Gerenciamento de canais SSE
    db/
      schema/               ← Drizzle schema (TypeScript)
      migrations/           ← Migrations geradas pelo Drizzle
      seeds/                ← db:seed (producao) e db:seed:test (testes)

  operator-app/             ← Central da Empresa (React + Vite PWA)
    src/
      pages/                ← Paginas da central
      components/           ← Componentes UI
      hooks/                ← Hooks de dados e SSE
      lib/                  ← API client, auth, utils

  shop-app/                 ← App do Lojista (React + Vite PWA)
    src/
      pages/
      components/
      hooks/
      lib/

  courier-app/              ← App do Motoboy (React + Vite PWA)
    src/
      pages/
      components/
      hooks/
      lib/

packages/
  shared/
    schemas/                ← Zod schemas (SOURCE OF TRUTH)
      entities/             ← order.ts, courier.ts, company.ts, shop.ts, delivery.ts
      api/                  ← Request/response schemas por recurso
      events/               ← SSE event schemas
      auth/                 ← Perfis, permissoes, JWT claims
    types/                  ← TypeScript types derivados dos schemas
    utils/                  ← Utilidades compartilhadas
    ui/                     ← Componentes UI compartilhados (shadcn customizado)
```

---

## Infraestrutura (Docker Compose)

### Servicos e Portas

| Servico | Porta interna | Alias | Funcao |
|---------|---------------|-------|--------|
| Caddy | ${PUBLIC_PORT} | caddy.internal | Reverse proxy unificado |
| Kong | 8000 | kong.internal | API Gateway (Supabase) |
| GoTrue | 9999 | gotrue.internal | Auth |
| PostgREST | 3000 | postgrest.internal | REST API Supabase (nao usado pela app) |
| PostgreSQL | 5432 | postgres.internal | Banco de dados |
| Redis | 6379 | redis.internal | Cache e pub/sub |
| Storage | 5000 | storage.internal | Supabase Storage |
| Studio | 3000 | studio.internal | Dashboard admin Supabase |
| Evolution | 8080 | evolution.internal | WhatsApp API |
| n8n | 5678 | n8n.internal | Workflow automation |
| MongoDB | 27017 | mongo.internal | Audit logs |
| Whisper | 8000 | whisper.internal | Transcricao de audio |
| Realtime | 4000 | realtime.internal | WebSocket Supabase (nao usado — usamos SSE) |
| Edge Runtime | 9000 | edge-runtime.internal | Edge functions |
| ImgProxy | 8080 | imgproxy.internal | Transformacao de imagens |

### Rede

Todos os servicos em rede Docker `internal`. Caddy e o unico ponto de entrada externo.

```
Internet → Caddy (:PUBLIC_PORT)
              ├── /auth/*, /rest/*, /storage/* → Kong → Supabase services
              ├── /api/* → Backbone (Hono)
              ├── /hub/* → Operator App (Vite)
              ├── /rota/* → Courier App (Vite)
              └── /portal/* → Shop App (Vite)
```

---

## Piramide de Derivacao

```
Zod Schemas (packages/shared/schemas/)
│
│  ← SOURCE OF TRUTH
│
├──→ Drizzle Schema (apps/backbone/db/)
│      TypeScript → migrations → PostgreSQL
│
├──→ OpenAPI Spec (gerada pelo @hono/zod-openapi)
│      rotas tipadas → documentacao → validacao
│
├──→ SSE Event Types (packages/shared/schemas/events/)
│      eventos tipados → pub/sub → clients subscrevem
│
├──→ Auth Types (packages/shared/schemas/auth/)
│      perfis, permissoes, JWT claims
│
└──→ Frontend Forms (apps/*/components/)
       validacao client-side com os mesmos schemas
```

---

## Autenticacao

1. Usuario entra email e senha no app (operator/shop/courier)
2. Client chama `supabase.auth.signInWithPassword()` via @supabase/supabase-js
3. GoTrue valida credenciais e retorna JWT com claims (role, company_id)
4. Client armazena JWT e envia em header `Authorization: Bearer {token}`
5. Backbone (Hono) valida JWT via middleware em toda rota protegida
6. Middleware extrai company_id e role do JWT e injeta no contexto da request
7. Todas as queries filtram por company_id (multi-tenancy)
8. Token renovado automaticamente via `supabase.auth.onAuthStateChange()`

### Convite de Usuarios

1. Operador envia convite (email + role) via Central da Empresa
2. Backbone chama GoTrue admin API para criar usuario com role no metadata
3. GoTrue envia email de convite com link de ativacao
4. Usuario clica no link, define senha e acessa o modulo correspondente

---

## Fluxo SSE (Real-Time)

```
1. Client conecta: GET /events/company/{companyId} (JWT no header)
2. Backbone valida JWT, extrai company_id, registra conexao no channel manager
3. Acao acontece (novo pedido, status muda, motoboy se move)
4. Service emite evento tipado (Zod schema) para o channel manager
5. Channel manager envia SSE para todos os clients daquele canal
6. Client recebe evento, parseia com Zod e atualiza UI
```

### Canais

| Canal | Subscribers | Eventos |
|-------|-------------|---------|
| `/events/company/{companyId}` | Operador, atendentes | Novos pedidos, status, localizacao motoboys, alertas |
| `/events/courier/{courierId}` | Motoboy | Entregas atribuidas, mudancas de rota, mensagens |
| `/events/order/{orderId}` | Lojista, destinatario | Status do pedido, posicao do motoboy, ETA |

---

## Bibliotecas Compartilhadas

| Funcao | Biblioteca | Versao |
|--------|------------|--------|
| Schemas | zod | ^3 |
| ORM | drizzle-orm | ^0.35 |
| Zod↔Drizzle | drizzle-zod | ^0.7 |
| API Framework | hono | ^4 |
| OpenAPI | @hono/zod-openapi | ^0.18 |
| Auth client | @supabase/supabase-js | ^2 |
| Forms | react-hook-form | ^7 |
| Zod resolver | @hookform/resolvers | ^3 |
| UI Components | shadcn/ui | latest |
| Estilizacao | tailwindcss | ^4 |
| Mapas | leaflet + react-leaflet | ^1.9 / ^4 |
| Date/time | date-fns | ^3 |
| HTTP client | ky | ^1 |
| State | @tanstack/react-query | ^5 |
| Tabelas | @tanstack/react-table | ^8 |
| Graficos | recharts | ^2 |
| Icons | lucide-react | latest |
| Toast | sonner | ^1 |

---

## Convencoes de Codigo

| Item | Convencao | Exemplo |
|------|-----------|---------|
| Arquivos | kebab-case | `order-service.ts` |
| Componentes React | PascalCase | `OrderList.tsx` |
| Funcoes/variaveis | camelCase | `getOrderById` |
| Tabelas SQL | snake_case plural | `courier_locations` |
| Campos SQL | snake_case | `company_id` |
| Enums SQL | snake_case | `order_status` |
| Schemas Zod | PascalCase + Schema | `OrderSchema` |
| Tipos TS | PascalCase | `Order` (inferido do Zod) |
| Eventos SSE | snake_case | `order_status_changed` |
| Rotas API | kebab-case plural | `/api/orders`, `/api/couriers` |
| Idioma codigo | Ingles | variaveis, tabelas, tipos, rotas |
| Idioma UI | Portugues (pt-BR) | labels, mensagens, erros |

---

## Componentes Supabase — O que Usar e O que Nao

| Componente | Usar | Justificativa |
|------------|------|---------------|
| PostgreSQL | Sim | Banco relacional. Drizzle conecta direto. |
| GoTrue | Sim | Auth pronto. JWT. Sessions. |
| Storage | Sim | Upload de arquivos. Integrado. |
| Studio | Sim | Admin visual do banco em dev. |
| Kong | Sim | Gateway. Ja no compose. |
| PostgREST | Nao | API e Hono. PostgREST seria duplicacao. |
| Realtime | Nao | WebSocket-based. O sistema usa SSE. |

---

## Seguranca

- [x] Auth centralizado via GoTrue (JWT)
- [x] Multi-tenancy por company_id em todas as queries
- [x] HTTPS em todas as comunicacoes (Caddy TLS)
- [x] Rate limiting por IP e por usuario (Redis)
- [x] Validacao de todos os inputs com Zod (backend e frontend)
- [x] Senhas gerenciadas exclusivamente pelo GoTrue (bcrypt)
- [x] CORS configuravel por ambiente
- [x] JWT validation em conexoes SSE
- [x] Isolamento de canais SSE por empresa
- [x] Logs de auditoria em MongoDB
- [x] Nenhum dado mock hardcoded — seeds para testes

---

## Performance

| Metrica | Alvo | Medicao |
|---------|------|---------|
| REST response (p95) | < 200ms | Benchmark com autocannon |
| SSE latency | < 500ms | Timestamp diff (emissao → recepcao) |
| SSE concurrent connections | >= 1000 | Load test com k6 |
| Lighthouse Performance | >= 90 | Lighthouse CI |
| Lighthouse Accessibility | >= 90 | Lighthouse CI |
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse / Web Vitals |
| FID (First Input Delay) | < 100ms | Web Vitals |
| CLS (Cumulative Layout Shift) | < 0.1 | Web Vitals |
| GPS location interval (entrega) | 15s | Config no courier-app |
| GPS location interval (disponivel) | 30s | Config no courier-app |
