# Design de Infraestrutura — Regras Arquiteturais

## Princípio

Regras gerais de arquitetura do sistema. Não descrevem componentes específicos — descrevem **como qualquer componente deve se comportar** dentro do ecossistema.

## Regras Gerais

### 1. Zod é o source of truth

Todo contrato do sistema — entidades, payloads, eventos, validações — é definido em Zod no package compartilhado. Nenhum componente inventa schemas próprios. Todos importam de `packages/shared/schemas/`.

### 2. Comunicação por REST, sincronização por SSE

- **Ações** (criar, atualizar, deletar) → REST com schemas Zod validados
- **Notificações e sync** (estado mudou, posição atualizada) → SSE unidirecional server → client
- **Sem polling** — nenhum componente faz polling para obter estado. Quem precisa de updates subscreve a um canal SSE.

### 3. Auth centralizado via Supabase GoTrue

- Login, JWT, sessions e permissões são resolvidos pelo GoTrue (Supabase self-hosted)
- Todos os componentes usam `@supabase/supabase-js` para auth
- Tokens JWT são a identidade do usuário em qualquer requisição

### 4. Schema no repositório, não só no banco

- O modelo de dados existe como código TypeScript (Drizzle schema) no repo
- Migrations são geradas a partir do schema, nunca escritas manualmente sem schema correspondente
- O agente lê o schema no repo para entender o modelo — nunca precisa conectar ao banco para saber a estrutura

### 5. OpenAPI gerado, não escrito

- A spec OpenAPI é gerada automaticamente a partir das rotas Hono + Zod (`@hono/zod-openapi`)
- Nunca se escreve OpenAPI YAML manualmente
- A documentação da API é sempre derivada do código — nunca diverge

### 6. Eventos tipados

- Todo evento SSE tem um schema Zod definido em `packages/shared/schemas/events/`
- Producers e consumers usam o mesmo type — sem divergência entre quem emite e quem consome

### 7. Isolamento por Docker Compose

- Supabase self-hosted roda em Docker Compose (PostgreSQL, GoTrue, Storage, Studio, Kong)
- Componentes da aplicação rodam no mesmo compose
- Dev environment local é idêntico à produção
- Dados ficam no Docker — controle total, sem cloud lock-in

### 8. Frontend decide pelo harness

- O framework/lib de frontend não é prescrito aqui
- O harness (via research) descobre o que é mais adequado
- A única regra: use os Zod schemas compartilhados para validação client-side

## Stack de Infraestrutura

| Camada | Tecnologia | Regra |
|---|---|---|
| **Banco** | PostgreSQL (Supabase Docker) | Schema Drizzle no repo. Migrations derivadas. |
| **ORM** | Drizzle | TypeScript-first. Conecta direto ao PostgreSQL. |
| **Auth** | GoTrue (Supabase) | Centralizado. JWT. @supabase/supabase-js nos clients. |
| **Storage** | Supabase Storage | Arquivos (fotos, comprovantes). Já integrado ao compose. |
| **API** | Hono + @hono/zod-openapi | Rotas tipadas. OpenAPI gerado. Validação automática. |
| **Real-time** | SSE nativo (Hono) | Unidirecional. Sem polling. Canais por recurso. |
| **Schemas** | Zod (packages/shared/) | Source of truth. Todos os componentes importam daqui. |

## Componentes Supabase — O que Usar e O que Não

| Componente | Usar? | Por quê |
|---|---|---|
| **PostgreSQL** | Sim | Banco relacional. Drizzle conecta direto. |
| **GoTrue** | Sim | Auth pronto. Não reinventar. |
| **Storage** | Sim | Upload de arquivos. Já integrado. |
| **Studio** | Sim | Admin visual do banco em dev. |
| **Kong** | Sim | Gateway. Já vem no compose. |
| **PostgREST** | Não | A API é Hono. PostgREST seria caminho duplicado. |
| **Realtime** | Não | WebSocket-based. O sistema usa SSE. |

## Pirâmide de Derivação

```
Zod Schemas (packages/shared/schemas/)
│
│  ← SOURCE OF TRUTH
│
├──→ Drizzle Schema (db/)
│      TypeScript → migrations → PostgreSQL
│
├──→ OpenAPI Spec (gerada pelo @hono/zod-openapi)
│      rotas tipadas → documentação → validação
│
├──→ SSE Event Types (packages/shared/schemas/events/)
│      eventos tipados → pub/sub → clients subscrevem
│
├──→ Auth Types (packages/shared/schemas/auth/)
│      perfis, permissões, JWT claims
│
└──→ Frontend Forms (apps/*/components/)
       validação client-side com os mesmos schemas
```

## Diagrama de Conexão

```
Qualquer app (web, mobile, PWA)
  │
  ├── REST ──→ API (Hono) ──→ Drizzle ──→ PostgreSQL
  ├── SSE  ←── API (push de eventos por canal)
  ├── Auth ──→ GoTrue (login/token) via @supabase/supabase-js
  └── Files ─→ Supabase Storage (upload)
```

Nenhum app fala direto com o banco. Nenhum app faz polling. Auth e storage vão direto pro Supabase. Dados e ações passam pela API. Sync vem por SSE.
