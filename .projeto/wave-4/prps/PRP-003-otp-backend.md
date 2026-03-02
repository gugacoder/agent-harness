---
status: current
wave: 4
session: wave-4--cc
---

# PRP-003 — OTP Backend (Services + Routes)

## Objetivo

Implementar o backend completo de login OTP: servicos de geracao/envio/verificacao de codigos, integracao com Evolution API (WhatsApp) e Nodemailer (SMTP), rate limiting via Redis, e rotas publicas de autenticacao.

## Execution Mode

`implementar`

## Contexto

O backend Hono esta em `apps/backbone/`. As rotas de auth existentes estao em `apps/backbone/src/routes/auth.ts` com endpoints para login (email+senha) e invite.

O Supabase client admin esta em `apps/backbone/src/lib/supabase.ts` — oferece `supabase.auth.admin.*` para operacoes administrativas.

A Evolution API roda no Docker como servico `evolution` (v2.3.7) acessivel em `http://evolution.internal:8080`. A autenticacao usa API Key via header `apikey`.

Redis roda no Docker como servico `redis` (7-alpine) acessivel em `redis://redis.internal:6379`.

A tabela `otp_codes` e os enums `otp_channel` serao criados pelo PRP-001. O schema Drizzle estara em `apps/backbone/db/schema/otp-codes.ts`.

Schemas Zod compartilhados ficam em `packages/shared/schemas/src/`. Atualmente este package existe mas tem poucos schemas.

## Especificacao

### 1. Instalar dependencias no workspace backbone

- `bcrypt` (^5.1) — hash de codigos OTP
- `nodemailer` (^6.9) — envio SMTP
- `@types/bcrypt` e `@types/nodemailer` como devDependencies
- `ioredis` (^5) — client Redis

### 2. Criar `apps/backbone/src/services/redis.ts`

Singleton de conexao Redis usando ioredis. URL via env var `REDIS_URL` (default `redis://redis.internal:6379`).

### 3. Criar `apps/backbone/src/services/whatsapp.service.ts`

Client para Evolution API conforme chegala-otp-login.md secao 7:
- Funcao `sendWhatsAppMessage(instanceUrl: string, apiKey: string, phone: string, message: string): Promise<void>`
- Faz POST para `{instanceUrl}/message/sendText/{instanceName}` com body `{ number: phone, text: message }`
- Header `apikey: {apiKey}`
- Obter instanceUrl e apiKey da company_configs da empresa do telefone
- Tratar erros de conexao com mensagem clara

### 4. Criar `apps/backbone/src/services/smtp.service.ts`

Wrapper Nodemailer conforme chegala-otp-login.md secao 7:
- Funcao `sendEmail(config: SmtpConfig, to: string, subject: string, html: string): Promise<void>`
- SmtpConfig: { host, port, user, pass, from, tls }
- Criar transporter com `nodemailer.createTransport()`
- TLS autodetect: tentar com `secure: true` (porta 465) ou `tls.rejectUnauthorized: false` para portas STARTTLS
- Template HTML do email OTP: logo da empresa, codigo em destaque grande, prazo de expiracao, instrucoes

### 5. Criar `apps/backbone/src/services/otp.service.ts`

Servico principal conforme chegala-otp-login.md secao 7:

**generateAndSend(phoneOrEmail, channel, companyId?):**
1. Verificar rate limit no Redis: `INCR otp:rate:{phoneOrEmail}` com `EXPIRE 60`. Se > 3, retornar erro 429.
2. Gerar codigo de 6 digitos usando `crypto.randomInt(100000, 999999)`
3. Hash com `bcrypt.hash(code, 10)`
4. Salvar em `otp_codes`: phone_or_email, code_hash, channel, company_id, expires_at = now + 5min
5. Se channel = 'whatsapp': buscar config WhatsApp da empresa, enviar via whatsapp.service
6. Se channel = 'email': buscar config SMTP da empresa, enviar via smtp.service
7. Se config do canal nao existe para a empresa, retornar erro 400 "Canal nao configurado"

**verify(phoneOrEmail, code):**
1. Buscar ultimo otp_codes nao verificado e nao expirado para o phoneOrEmail
2. Se nao encontrar, retornar erro "Codigo invalido ou expirado"
3. Se attempts >= 5, retornar erro "Muitas tentativas — solicite novo codigo"
4. Incrementar attempts
5. `bcrypt.compare(code, code_hash)`. Se falhar, retornar erro "Codigo invalido"
6. Marcar como verified = true
7. Lookup: buscar profile por phone (profiles.phone = phoneOrEmail) ou por email (auth.users.email = phoneOrEmail)
8. Se profile encontrado: emitir JWT via `supabase.auth.admin.generateLink({ type: 'magiclink', email: userEmail })` ou via mecanismo adequado do GoTrue admin
9. Retornar { access_token, refresh_token, user: { id, email, role, companyId } }

### 6. Criar Zod schemas em `packages/shared/schemas/src/otp.ts`

- `SendOtpSchema`: `{ phone_or_email: z.string().min(1), channel: z.enum(["whatsapp", "email"]) }`
- `VerifyOtpSchema`: `{ phone_or_email: z.string().min(1), code: z.string().length(6) }`

### 7. Adicionar rotas OTP em `apps/backbone/src/routes/auth.ts`

Adicionar ao router de auth existente (NAO substituir rotas existentes):

- `POST /api/auth/otp/send` — publico, sem auth middleware. Valida input com SendOtpSchema. Chama otp.service.generateAndSend.
- `POST /api/auth/otp/verify` — publico, sem auth middleware. Valida input com VerifyOtpSchema. Chama otp.service.verify. Retorna tokens.

### 8. Adicionar REDIS_URL ao docker-compose

Adicionar env var `REDIS_URL=redis://redis.internal:6379` ao servico `backbone` em `docker-compose.yml`.

## Limites

- NAO alterar as rotas de login existentes (email+senha) — elas continuam funcionando como fallback
- NAO implementar frontend — este PRP e exclusivamente backend
- NAO implementar os endpoints de teste (test-smtp, test-whatsapp) — isso e PRP-004
- NAO modificar GoTrue/Kong config — usar Supabase Admin API para emissao de tokens
- NAO armazenar codigos OTP em texto claro — sempre hash bcrypt
- NAO expor a API Key da Evolution no response — apenas usar server-side
