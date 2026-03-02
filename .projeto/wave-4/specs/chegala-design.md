# Chega.la - Design Wave 4: Seguranca, Login, Perfil

Decisoes de arquitetura e design para as features da Wave 4. Complementa o design das waves anteriores — nao repete stack existente.

---

## Stack — Adicoes Wave 4

| Camada | Tecnologia | Versao | Justificativa |
|--------|------------|--------|---------------|
| OTP Backend | bcrypt (hash de codigos) | ^5 | Hash de codigos OTP. Previne leitura direta do banco |
| OTP WhatsApp | Evolution API (self-hosted) | v2.3.7 | Ja na stack. Zero custo vs SMS. WhatsApp domina no BR |
| OTP Email | Nodemailer | ^6 | SMTP client maduro. Suporta TLS autodetect |
| Rate Limiting | Redis (existente) | 7-alpine | Ja na stack. Contadores expiraveis para rate limit OTP |
| Avatar Crop | react-easy-crop | ^5 | MIT, 3K+ stars. Crop circular com gestos touch |
| Avatar Compress | browser-image-compression | ^2 | Compressao client-side. Reduz carga de upload |
| HEIC Conversion | heic2any | ^0.0.4 | Conversao HEIC→JPEG no browser (fotos iOS) |
| Avatar Storage | Supabase Storage (existente) | v1.37.1 | Bucket `avatars`. Ja na stack com imgproxy |

---

## Middleware — Nova Camada RBAC

### Arquitetura de middleware (pipeline Hono)

```
Request
  → authMiddleware (existente — valida JWT, extrai user)
    → companyMiddleware (existente — isola tenant)
      → requireRole(...roles) (NOVO — verifica role)
        → Route Handler
```

### requireRole — Design

```typescript
// apps/backbone/src/middleware/role.ts
import { createMiddleware } from "hono/factory";
import type { AppType } from "../types.js";

type Role = "operator" | "shop" | "courier" | "super_admin";

export const requireRole = (...roles: Role[]) =>
  createMiddleware<AppType>(async (c, next) => {
    const user = c.get("user");
    if (!roles.includes(user.role as Role)) {
      console.warn(`[RBAC] Blocked: user=${user.id} role=${user.role} endpoint=${c.req.path} required=${roles.join(",")}`);
      return c.json({
        error: "Forbidden",
        message: "Voce nao tem permissao para esta acao",
        statusCode: 403,
      }, 403);
    }
    await next();
  });
```

### Super Admin — Bypass de Company

```typescript
// Modificar companyMiddleware para permitir super_admin sem company_id
export const companyMiddleware = createMiddleware<AppType>(async (c, next) => {
  const user = c.get("user");

  // Super admin pode operar sem company ou com company impersonada
  if (user.role === "super_admin") {
    const impersonateCompanyId = c.req.header("X-Impersonate-Company");
    if (impersonateCompanyId) {
      c.set("companyId", impersonateCompanyId);
    }
    return next();
  }

  // Fluxo existente para roles normais...
});
```

---

## Fluxo OTP — Diagrama

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌─────────────┐
│  Frontend   │     │  Backbone    │     │  Redis          │     │  Evolution/ │
│  (PWA)      │     │  (Hono)      │     │  (rate limit)   │     │  SMTP       │
└──────┬──────┘     └──────┬───────┘     └────────┬────────┘     └──────┬──────┘
       │                   │                      │                     │
       │ POST /auth/otp/send                      │                     │
       │ { phone, channel }│                      │                     │
       │──────────────────>│                      │                     │
       │                   │ INCR otp:{phone}     │                     │
       │                   │─────────────────────>│                     │
       │                   │      count <= 3?     │                     │
       │                   │<─────────────────────│                     │
       │                   │                      │                     │
       │                   │ gerar codigo 6 dig   │                     │
       │                   │ salvar hash bcrypt   │                     │
       │                   │ em otp_codes (5min)  │                     │
       │                   │                      │                     │
       │                   │ enviar codigo via canal                    │
       │                   │──────────────────────────────────────────>│
       │                   │                      │                     │
       │    { ok: true }   │                      │                     │
       │<──────────────────│                      │                     │
       │                   │                      │                     │
       │ POST /auth/otp/verify                    │                     │
       │ { phone, code }   │                      │                     │
       │──────────────────>│                      │                     │
       │                   │ buscar otp_codes     │                     │
       │                   │ bcrypt.compare(code) │                     │
       │                   │                      │                     │
       │                   │ lookup profile by phone                    │
       │                   │ supabase.admin.generateLink()             │
       │                   │ ou signInWithPassword (temp)               │
       │                   │                      │                     │
       │  { token, user }  │                      │                     │
       │<──────────────────│                      │                     │
```

### Detalhamento dos Endpoints OTP

| Endpoint | Metodo | Auth | Input | Output | Rate Limit |
|----------|--------|------|-------|--------|------------|
| /api/auth/otp/send | POST | publico | `{ phone_or_email, channel: "whatsapp" \| "email" }` | `{ ok: true }` | 3/min por phone |
| /api/auth/otp/verify | POST | publico | `{ phone_or_email, code }` | `{ access_token, user }` | 5 tentativas por codigo |

---

## Fluxo Avatar — Pipeline

```
[Selecionar imagem]
    │
    ▼
[HEIC? → heic2any → JPEG]
    │
    ▼
[react-easy-crop: crop circular + zoom]
    │
    ▼
[Canvas → toBlob("image/webp")]
    │
    ▼
[browser-image-compression: max 500KB, 512x512]
    │
    ▼
[supabase.storage.upload("avatars/{userId}.webp")]
    │
    ▼
[PATCH /api/profiles/me { avatar_url }]
    │
    ▼
[Invalidar cache + atualizar UI]
```

---

## Estrutura de Novos Arquivos

```
apps/backbone/src/
├── middleware/
│   ├── auth.ts            (existente)
│   ├── company.ts         (modificar — super_admin bypass)
│   ├── role.ts            (NOVO — requireRole)
│   └── error-handler.ts   (existente)
├── routes/
│   ├── auth.ts            (modificar — adicionar OTP routes)
│   ├── admin.ts           (NOVO — super admin routes)
│   ├── users.ts           (NOVO — gestao de usuarios)
│   └── profiles.ts        (NOVO — PATCH /profiles/me)
├── services/
│   ├── otp.service.ts     (NOVO — gerar, enviar, verificar OTP)
│   ├── whatsapp.service.ts(NOVO — Evolution API client)
│   ├── smtp.service.ts    (NOVO — Nodemailer wrapper)
│   └── user.service.ts    (NOVO — CRUD usuarios)
└── db/schema/
    ├── _enums.ts          (modificar — adicionar super_admin, registration_status)
    ├── otp-codes.ts       (NOVO)
    ├── company-config.ts  (modificar — adicionar campos OTP)
    ├── couriers.ts        (modificar — adicionar vehicle_type, plate, cnh)
    └── registration-requests.ts (NOVO)

apps/central/src/
├── pages/
│   ├── UsuariosPage.tsx   (NOVO — gestao de usuarios)
│   ├── AdminDashboard.tsx (NOVO — super admin)
│   └── PerfilPage.tsx     (NOVO — meu perfil)
├── components/
│   ├── avatar-upload.tsx  (NOVO — shared via packages)
│   └── otp-input.tsx      (NOVO — shared via packages)

apps/motoboy/src/
├── pages/
│   ├── LoginPage.tsx      (modificar — adicionar OTP flow)
│   └── PerfilPage.tsx     (NOVO)

apps/lojista/src/
├── pages/
│   ├── LoginPage.tsx      (modificar — adicionar OTP flow)
│   └── PerfilPage.tsx     (NOVO)

packages/shared/schemas/src/
├── otp.ts                 (NOVO — schemas Zod para OTP)
├── profile.ts             (NOVO — schemas Zod para perfil)
└── user-management.ts     (NOVO — schemas Zod para gestao)
```

---

## Bibliotecas — Versoes Vinculantes

| Funcao | Biblioteca | Versao | Nota |
|--------|------------|--------|------|
| Hash OTP | bcrypt | ^5.1 | bcrypt.hash / bcrypt.compare |
| SMTP | nodemailer | ^6.9 | createTransport com TLS autodetect |
| Avatar crop | react-easy-crop | ^5.1 | Crop circular, touch, zoom |
| Compressao | browser-image-compression | ^2.0 | maxSizeMB: 0.5, maxWidthOrHeight: 512 |
| HEIC → JPEG | heic2any | ^0.0.4 | Converte fotos iOS antes do crop |
| OTP Input | input-otp | ^1.4 | Componente OTP 6 digitos (shadcn pattern) |

---

## Convencoes Wave 4

| Item | Convencao | Exemplo |
|------|-----------|---------|
| Role guard | `requireRole()` antes de cada rota protegida | `app.post("/shops", requireRole("operator", "super_admin"), handler)` |
| OTP storage | Hash bcrypt no PostgreSQL, contador no Redis | `otp_codes.code_hash`, `otp:{phone}` |
| Avatar path | `avatars/{userId}.webp` no Supabase Storage | `avatars/550e8400-e29b.webp` |
| Super admin header | `X-Impersonate-Company: {uuid}` | Header opcional para impersonacao |
| Rotas admin | Prefixo `/api/admin/` exclusivo para super_admin | `/api/admin/companies` |
| Schemas compartilhados | `packages/shared/schemas/src/` | Zod schemas usados por frontend e backend |

---

## Seguranca — Checklist Wave 4

- [x] JWT validado em cada request (existente — authMiddleware)
- [x] Isolamento multi-tenant (existente — companyMiddleware)
- [ ] Role-check em cada endpoint protegido (requireRole)
- [ ] OTP hash bcrypt, nunca texto claro
- [ ] Rate limiting por telefone/email (Redis)
- [ ] Brute force protection (max 5 tentativas por codigo)
- [ ] Credenciais SMTP/Evolution encrypted at rest
- [ ] Super admin com bypass de company controlado
- [ ] CORS restrito a dominios do app
- [ ] Logs de auditoria para acoes RBAC bloqueadas
