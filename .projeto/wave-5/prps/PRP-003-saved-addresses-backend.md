---
status: current
---

# PRP-003 — Saved Addresses Backend

## Objetivo

Implementar CRUD de enderecos salvos no backbone (rotas + servico) e logica de auto-save de enderecos na criacao de pedidos.

## Execution Mode

`implementar`

## Contexto

A tabela `saved_addresses` ja existe no banco (PRP-001). O backbone segue padrao OpenAPIHono com Zod validation, `authMiddleware` + `companyMiddleware`. Servicos sao funcoes async em arquivos `.service.ts`. A rota `POST /api/orders` em `apps/backbone/src/routes/orders.ts` cria pedidos — e nela que o auto-save deve ser integrado.

O `order.service.ts` tem `createOrder()` que insere no banco e retorna o pedido. A logica de auto-save deve ser chamada apos criacao bem-sucedida do pedido.

## Especificacao

### 1. Servico — `apps/backbone/src/services/address.service.ts`

Funcoes:

**`listSavedAddresses(profileId, companyId, options?)`**
- Retornar enderecos do perfil, ordenados: favoritos primeiro (is_favorite DESC), depois por use_count DESC
- Opcoes: `search` (busca textual em label + address), `sort` (most_used | recent | alpha)

**`createSavedAddress(data)`**
- Inserir na tabela `saved_addresses`
- Campos obrigatorios: company_id, profile_id, address, lat, lng
- Campos opcionais: label, complement, reference, is_favorite

**`updateSavedAddress(id, profileId, companyId, data)`**
- Atualizar campos: label, address, lat, lng, complement, reference, is_favorite
- Verificar que o endereco pertence ao profile_id e company_id (multi-tenancy + ownership)

**`deleteSavedAddress(id, profileId, companyId)`**
- Remover endereco. Verificar ownership.

**`autoSaveAddress(profileId, companyId, address, lat, lng)`**
- Verificar se endereco ja existe: `WHERE profile_id = X AND address = Y`
- Se existe: atualizar `use_count = use_count + 1`, `last_used_at = now()`
- Se nao existe:
  - Contar enderecos nao-favoritos do perfil
  - Se >= 10: deletar o mais antigo nao-favorito (menor last_used_at, ou menor created_at se last_used_at null)
  - Inserir novo com `use_count = 1`, `last_used_at = now()`

### 2. Rotas — `apps/backbone/src/routes/saved-addresses.ts`

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/saved-addresses | Listar enderecos do usuario autenticado. Query: search, sort |
| POST | /api/saved-addresses | Criar endereco salvo |
| PATCH | /api/saved-addresses/:id | Atualizar endereco (label, favorito, dados) |
| DELETE | /api/saved-addresses/:id | Remover endereco salvo |

Detalhes:
- GET: filtrar por `profile_id` do usuario autenticado (extrair de `c.get("profileId")` ou equivalente)
- POST: validar body com Zod, company_id do middleware, profile_id do auth
- PATCH: validar ownership (profile_id + company_id) antes de atualizar
- DELETE: validar ownership antes de remover

### 3. Integracao no fluxo de criacao de pedidos

No handler de `POST /api/orders` (em `orders.ts`), apos criacao bem-sucedida do pedido:
- Chamar `autoSaveAddress(profileId, companyId, delivery_address, delivery_lat, delivery_lng)`
- Execucao assincrona (nao bloquear response do pedido) — usar `.catch()` para silenciar erros

### 4. Schemas compartilhados

Criar `packages/shared/schemas/entities/saved-address.ts`:
- `SavedAddressSchema` (entidade completa)

Criar `packages/shared/schemas/api/saved-addresses.ts`:
- `CreateSavedAddressSchema` (request body)
- `UpdateSavedAddressSchema` (request body parcial)
- `SavedAddressResponseSchema` (response)
- `SavedAddressListResponseSchema` (array response)

### 5. Registro da rota

Registrar no app principal com prefixo `/api/saved-addresses`.

## Limites

- Nao alterar o schema da tabela `saved_addresses` (ja criado no PRP-001)
- Nao alterar o comportamento existente de criacao de pedidos — apenas adicionar o auto-save como side-effect
- Nao implementar frontend neste PRP
- Operadores podem ver enderecos de todas as lojas da empresa (filtro por company_id). Lojistas veem apenas os proprios (filtro por profile_id)
