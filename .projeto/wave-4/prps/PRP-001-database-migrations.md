---
status: current
wave: 4
session: wave-4--cc
---

# PRP-001 — Database Migrations Wave 4

## Objetivo

Gerar a migration Drizzle com todas as alteracoes de schema da Wave 4: novos enums, novas tabelas, colunas adicionais em tabelas existentes e indices.

## Execution Mode

`implementar`

## Contexto

O projeto usa Drizzle ORM com PostgreSQL (Supabase self-hosted). Os schemas Drizzle ficam em `apps/backbone/db/schema/` com um arquivo por entidade. Os enums ficam em `apps/backbone/db/schema/_enums.ts`. O index de re-export fica em `apps/backbone/db/schema/index.ts`.

Existem 2 migrations anteriores:
- `0000_material_big_bertha.sql` — tabelas base (companies, profiles, shops, couriers, orders, deliveries, etc.)
- `0001_fearless_hitman.sql` — wave 2 (pricing, financial, invoices, company_configs)

Padroes SQL estabelecidos:
- PKs: `uuid DEFAULT gen_random_uuid()`
- Timestamps: `timestamp with time zone DEFAULT now()`
- FKs: `ON DELETE restrict ON UPDATE no action`
- Trigger `update_updated_at()` ja existe e e reutilizado
- Indices com prefixo `idx_`
- Enums no schema `public`

O comando para gerar migrations e `npm run db:generate` (executa `drizzle-kit generate`).

## Especificacao

### 1. Novos enums em `_enums.ts`

Adicionar ao arquivo existente `apps/backbone/db/schema/_enums.ts`:

- `otpChannelEnum`: valores `'whatsapp'`, `'email'`
- `registrationStatusEnum`: valores `'pending'`, `'approved'`, `'rejected'`

### 2. Modificar enum existente

Adicionar valor `'super_admin'` ao `userRoleEnum` existente. No Drizzle, basta adicionar ao array de valores do `pgEnum`. A migration gerada fara `ALTER TYPE ... ADD VALUE`.

### 3. Nova tabela `otp_codes`

Criar arquivo `apps/backbone/db/schema/otp-codes.ts` conforme chegala-er.md secao "otp_codes". Campos: id (uuid PK), phone_or_email (text), code_hash (text), channel (otp_channel), company_id (uuid FK nullable), attempts (integer default 0), verified (boolean default false), expires_at (timestamptz), created_at (timestamptz).

### 4. Nova tabela `registration_requests`

Criar arquivo `apps/backbone/db/schema/registration-requests.ts` conforme chegala-er.md secao "registration_requests". Campos: id (uuid PK), company_id (uuid FK), full_name (text), phone (text), email (text nullable), requested_role (user_role), status (registration_status default 'pending'), extra_data (jsonb), requested_at (timestamptz), reviewed_at (timestamptz nullable), reviewed_by (uuid FK nullable).

### 5. Modificar `company-config.ts`

Adicionar campos OTP conforme chegala-er.md secao "company_configs — Novos campos OTP":
- otp_whatsapp_enabled (boolean default false)
- otp_whatsapp_url (text nullable)
- otp_whatsapp_api_key (text nullable)
- otp_smtp_enabled (boolean default false)
- otp_smtp_host, otp_smtp_port, otp_smtp_user, otp_smtp_pass_encrypted, otp_smtp_from (text/integer nullable)
- otp_smtp_tls (boolean default true)

### 6. Modificar `couriers.ts`

Adicionar campos conforme chegala-er.md:
- vehicle_type (text nullable)
- plate (text nullable)
- cnh (text nullable)

### 7. Modificar `shops.ts`

Adicionar campo conforme chegala-er.md:
- business_hours (jsonb nullable)

### 8. Atualizar `index.ts`

Adicionar exports para as novas tabelas (otp-codes, registration-requests) e novos enums.

### 9. Gerar migration

Executar `npm run db:generate` para gerar o arquivo SQL da migration. Verificar o SQL gerado.

### 10. Adicionar indices ao SQL gerado

Se o Drizzle nao gerar os indices automaticamente, adicionar manualmente ao final da migration conforme chegala-er.md secao "Indices Recomendados":
- `idx_otp_codes_lookup` — busca por phone_or_email + expires_at (parcial: verified = false)
- `idx_otp_codes_expires` — limpeza de expirados (parcial: verified = false)
- `idx_registration_requests_company_status` — pendentes por empresa (parcial: status = 'pending')
- `idx_registration_requests_phone` — busca por telefone + empresa

## Limites

- NAO alterar colunas existentes de tabelas existentes (apenas adicionar novas colunas)
- NAO remover ou renomear campos existentes
- NAO alterar FKs ou constraints existentes
- NAO executar `npm run db:migrate` — apenas gerar a migration
- NAO modificar dados existentes (e uma migration DDL, nao DML)
- NAO criar triggers novos — reutilizar o `update_updated_at()` existente (company_configs ja tem trigger)
