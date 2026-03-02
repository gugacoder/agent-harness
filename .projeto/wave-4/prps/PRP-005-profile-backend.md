---
status: current
wave: 4
session: wave-4--cc
---

# PRP-005 — Profile API (Backend)

## Objetivo

Implementar endpoint PATCH /api/profiles/me para edicao de perfil do usuario autenticado, com sincronizacao Supabase Auth e atualizacao de dados role-specific (courier fields, shop fields).

## Execution Mode

`implementar`

## Contexto

A tabela `profiles` ja existe em `apps/backbone/db/schema/profiles.ts` com campos id, company_id, role, full_name, phone, avatar_url, active, timestamps. O id do profile e o mesmo do auth.users (FK).

As tabelas `couriers` e `shops` tem FK `profile_id` para profiles. O PRP-001 adicionara campos vehicle_type, plate e cnh em couriers, e business_hours em shops.

O Supabase client admin esta em `apps/backbone/src/lib/supabase.ts` com acesso a `supabase.auth.admin.*`. As alteracoes de nome e email precisam ser sincronizadas com auth.users via admin API para manter JWT consistente.

Nao existe nenhuma rota de profiles atualmente. O middleware de auth extrai user.id, user.companyId e user.role do JWT. Os schemas Zod compartilhados ficam em `packages/shared/schemas/`.

O arquivo `apps/backbone/src/services/storage.service.ts` ja existe com logica de upload para Supabase Storage (usado para delivery proofs). Pode servir de referencia para upload de avatars.

## Especificacao

### 1. Criar `apps/backbone/src/routes/profiles.ts`

Implementar os seguintes endpoints:

**GET /api/profiles/me** — requireRole('operator', 'shop', 'courier', 'super_admin'). Retorna o profile do usuario autenticado (buscar por user.id). Se role = courier, incluir dados de couriers (vehicle_type, plate, cnh). Se role = shop, incluir dados de shops (trade_name, address, business_hours). Retorna `{ profile: {...} }`.

**PATCH /api/profiles/me** — requireRole('operator', 'shop', 'courier', 'super_admin'). Aceita campos conforme OSD061-OSD068, OSD070, OSD072:
- Campos base (todos os roles): full_name, phone
- Campos courier (role = courier): vehicle_type, plate, cnh
- Campos shop (role = shop): trade_name, address, business_hours
- Campo avatar_url: atualizado apos upload (string URL)

Validacoes:
- Unicidade de phone dentro da mesma empresa (OSD064)
- Se full_name alterado, sincronizar com `supabase.auth.admin.updateUserById(userId, { user_metadata: { full_name } })` (OSD067)
- Ignorar campos role-specific que nao pertencem ao role do usuario (ex: courier fields para um shop)
- Retornar o profile atualizado

### 2. Criar Zod schemas em `packages/shared/schemas/src/profile-api.ts`

- `UpdateProfileSchema`: campos opcionais — full_name (string min 2), phone (string min 10), vehicle_type, plate, cnh, trade_name, address, business_hours (jsonb), avatar_url
- Exportar do index.ts do package

### 3. Registrar rotas no app principal

Importar e montar o router de profiles em `apps/backbone/src/index.ts`. As rotas devem ficar apos os middlewares de auth e company, e usar requireRole do PRP-002.

### 4. Criar bucket de avatars no Supabase Storage

Adicionar script SQL ou instrucao para criar bucket `avatars` no Supabase Storage com politicas:
- Upload: autenticado, path deve comecar com `{userId}/`
- Read: publico (avatar visivel para todos)
- Delete: autenticado, apenas o proprio usuario

Nota: se nao for possivel criar bucket via migration, documentar os comandos SQL para execucao manual no Supabase Studio.

## Limites

- NAO implementar endpoints de gestao de usuarios (GET /users, PATCH /users/:id) — isso e PRP-009
- NAO implementar logica de crop ou upload de imagem no backend — o frontend faz crop e compressao, o backend apenas recebe a URL final do Storage
- NAO alterar a rota de invite existente em auth.ts
- NAO implementar verificacao de email via OTP na troca de email — deixar para wave futura
- NAO alterar o schema das tabelas — apenas ler e escrever nos campos existentes (novos campos vem do PRP-001)
