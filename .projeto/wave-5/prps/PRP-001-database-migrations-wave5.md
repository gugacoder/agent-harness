---
status: current
---

# PRP-001 — Database Migrations Wave 5

## Objetivo

Criar a migration Drizzle para a Wave 5: nova tabela `saved_addresses`, novos campos em `couriers` e `shops`, indices e triggers associados.

## Execution Mode

`implementar`

## Contexto

O projeto usa Drizzle ORM com migrations em `apps/backbone/db/migrations/`. Existem 2 migrations (0000, 0001). Schemas Drizzle ficam em `apps/backbone/db/schema/` com um arquivo por dominio (`_enums.ts`, `companies.ts`, `couriers.ts`, `shops.ts`, etc.). Todas as tabelas seguem o padrao: UUID PK com `gen_random_uuid()`, campos `created_at`/`updated_at` como `TIMESTAMPTZ DEFAULT now()`, trigger `update_updated_at()` para auto-update, indices com prefixo `idx_`, FKs com `ON DELETE restrict` (exceto cascade para dados dependentes de usuario).

O schema da tabela `couriers` atual tem: id, company_id, profile_id, full_name, phone, photo_url, status, total_deliveries, active, created_at, updated_at.

O schema da tabela `shops` atual tem: id, company_id, profile_id, trade_name, phone, address, lat, lng, active, created_at, updated_at.

## Especificacao

### 1. Schema Drizzle — nova tabela

Criar `apps/backbone/db/schema/saved-addresses.ts`:

Tabela `saved_addresses` conforme chegala-er.md secao "Nova Entidade":
- id (uuid PK), company_id (FK companies), profile_id (FK profiles, ON DELETE cascade)
- label (text nullable), address (text NOT NULL), lat/lng (numeric 10,7 NOT NULL)
- complement (text nullable), reference (text nullable)
- is_favorite (boolean default false), use_count (integer default 0)
- last_used_at (timestamptz nullable), created_at, updated_at

Exportar a tabela e suas relations no barrel `apps/backbone/db/schema/index.ts`.

### 2. Schema Drizzle — alteracoes em tabelas existentes

Em `apps/backbone/db/schema/couriers.ts`, adicionar:
- `vehicle_type` (text nullable)
- `plate_number` (text nullable)

Em `apps/backbone/db/schema/shops.ts`, adicionar:
- `contact_name` (text nullable)

### 3. Migration

Rodar `npm run db:generate` para gerar a migration automaticamente via Drizzle Kit.

Apos geracao, editar a migration SQL para adicionar manualmente (Drizzle nao gera triggers/indices customizados):

Indices conforme chegala-er.md secao "Indices Recomendados (Wave 5)":
- `idx_saved_addresses_profile` — (profile_id, is_favorite DESC, use_count DESC)
- `idx_saved_addresses_company` — (company_id)
- `idx_saved_addresses_label` — (profile_id, label) WHERE label IS NOT NULL
- `idx_saved_addresses_recent` — (profile_id, last_used_at DESC NULLS LAST)

Trigger:
- `trg_saved_addresses_updated_at` — reutilizar `update_updated_at()` existente

### 4. Validacao

Rodar `npm run db:migrate` para aplicar. Verificar que as tabelas existentes nao perdem dados (todos os novos campos sao nullable).

## Limites

- Nao alterar schemas de tabelas que nao estao no escopo (orders, deliveries, etc.)
- Nao criar enums novos (`vehicle_type` fica como texto livre)
- Nao alterar FKs ou constraints existentes
- Nao remover nenhum campo ou tabela existente
