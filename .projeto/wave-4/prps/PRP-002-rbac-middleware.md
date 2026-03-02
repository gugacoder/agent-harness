---
status: current
wave: 4
session: wave-4--cc
---

# PRP-002 — RBAC Middleware + Role Guards

## Objetivo

Implementar middleware `requireRole()` no Hono e aplicar role guards em todas as rotas existentes conforme a matriz de permissoes.

## Execution Mode

`implementar`

## Contexto

O backend Hono tem dois middlewares de seguranca em `apps/backbone/src/middleware/`:
- `auth.ts` — valida JWT, extrai `user.id`, `user.companyId`, `user.role` do GoTrue token
- `company.ts` — isola tenant por `companyId`, bloqueia cross-tenant

O tipo compartilhado esta em `apps/backbone/src/types.ts`:
```
AppType.Variables.user = { id: string; companyId: string; role: string }
```

Os middlewares sao aplicados globalmente em `apps/backbone/src/index.ts` antes das rotas. Nenhuma rota verifica o `role` — e a vulnerabilidade D-027.

Rotas existentes em `apps/backbone/src/routes/`: auth.ts, companies.ts, orders.ts, shops.ts, couriers.ts, deliveries.ts, analytics.ts, financial.ts, pricing.ts, invoices.ts, company-config.ts, delivery-proof.ts, earnings.ts, events.ts, health.ts.

## Especificacao

### 1. Criar `apps/backbone/src/middleware/role.ts`

Implementar factory function `requireRole(...roles)` conforme chegala-design.md secao "requireRole — Design":
- Aceita spread de roles como parametro
- Le `user.role` do contexto Hono (set pelo authMiddleware)
- Se role nao esta na lista, retorna 403 com `{ error: "Forbidden", message: "Voce nao tem permissao para esta acao", statusCode: 403 }`
- Loga tentativas bloqueadas com `console.warn` incluindo user_id, endpoint, role_atual, roles_requeridos
- Tipo `Role` inclui: `"operator" | "shop" | "courier" | "super_admin"`

### 2. Modificar `apps/backbone/src/middleware/company.ts`

Adicionar bypass para `super_admin` conforme chegala-design.md secao "Super Admin — Bypass de Company":
- Se `user.role === "super_admin"`, nao exigir `companyId`
- Ler header `X-Impersonate-Company` para impersonacao
- Se header presente, setar `companyId` com o valor do header
- Se header ausente e role e super_admin, prosseguir sem companyId setado

### 3. Atualizar `apps/backbone/src/types.ts`

Alterar o tipo `role` de `string` para o union type literal: `"operator" | "shop" | "courier" | "super_admin"`. Tornar `companyId` opcional (string | undefined) para suportar super_admin.

### 4. Aplicar `requireRole()` em TODAS as rotas existentes

Seguir ESTRITAMENTE a matriz de permissoes da chegala-requirements.md:

| Rota | Roles permitidos |
|------|-----------------|
| POST /api/orders | shop, super_admin |
| GET /api/orders | operator, shop, courier, super_admin |
| POST /api/shops | operator, super_admin |
| PATCH /api/company/config | operator, super_admin |
| POST /api/auth/invite | operator, super_admin |
| POST /api/deliveries/:id/accept | courier, super_admin |
| GET /api/analytics | operator, super_admin |
| GET /api/financial/* | operator, super_admin |
| GET /api/pricing/* | operator, super_admin |
| GET /api/couriers/* | operator, super_admin |
| GET /api/earnings/* | courier, super_admin |
| POST /api/delivery-proof/* | courier, super_admin |
| GET /api/events | operator, shop, courier, super_admin |

Para cada arquivo de rota, importar `requireRole` e adicionar como middleware antes do handler de cada endpoint. Exemplo: `app.post("/shops", requireRole("operator", "super_admin"), createShop)`.

Rotas publicas que NAO recebem requireRole: `/api/health`, `/api/auth/login`, `/api/auth/invite/accept`, `/api/auth/otp/*`.

### 5. Exportar middleware

Exportar `requireRole` do arquivo role.ts para uso nas rotas.

## Limites

- NAO alterar a logica interna dos route handlers — apenas adicionar o middleware antes
- NAO remover ou modificar authMiddleware ou companyMiddleware (exceto o bypass de super_admin no company)
- NAO criar rotas novas neste PRP — apenas proteger as existentes
- NAO implementar rotas de admin (super admin routes) — isso e PRP-010
- NAO alterar o frontend — este PRP e exclusivamente backend
