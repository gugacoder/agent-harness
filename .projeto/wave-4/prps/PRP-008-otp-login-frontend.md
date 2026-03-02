---
status: current
wave: 4
session: wave-4--cc
---

# PRP-008 — OTP Login UI (Frontend)

## Objetivo

Implementar a interface de login via OTP (WhatsApp + Email) nos tres apps (Motoboy, Lojista, Central), com componentes de input de telefone/email, input de codigo OTP, timer de reenvio e hook de state machine.

## Execution Mode

`implementar`

## Contexto

Cada app ja tem uma LoginPage existente:
- `apps/motoboy/src/pages/LoginPage.tsx` — login email+senha
- `apps/lojista/src/pages/LoginPage.tsx` — login email+senha
- `apps/central/src/pages/LoginPage.tsx` — login email+senha (se existir, ou fluxo de auth em AuthContext)

O fluxo de auth usa `useAuth()` context que chama `supabase.auth.signInWithPassword()`. O OTP login devera integrar com o mesmo contexto, setando session/user apos receber tokens do backend.

O PRP-003 implementara os endpoints POST /api/auth/otp/send e POST /api/auth/otp/verify no backend. O frontend faz chamadas HTTP via Ky (configurado em `src/lib/api.ts`).

A spec chegala-otp-login.md define componentes PhoneInput, OtpInput, OtpResendTimer e hook useOtpLogin. O design define `input-otp` ^1.4 como biblioteca vinculante para o componente OTP (padrao shadcn).

## Especificacao

### 1. Instalar dependencias

Em cada app frontend, instalar:
- `input-otp` ^1.4 — componente OTP de 6 digitos (padrao shadcn)

### 2. Criar componente PhoneInput

Conforme chegala-otp-login.md secao 4.1 e OSD045:

**Localizacao:** criar dentro do app que usar (ex: `src/components/auth/PhoneInput.tsx`)

- Props: value, onChange, error, disabled
- Mascara brasileira: (XX) XXXXX-XXXX
- Prefixo +55 fixo com emoji bandeira BR ou icone
- `inputMode="tel"` para teclado numerico em mobile
- Validacao de formato inline (minimo 11 digitos)

### 3. Criar componente OtpInput

Conforme chegala-otp-login.md secao 4.2 e OSD046, OSD049:

**Localizacao:** `src/components/auth/OtpInput.tsx`

- Usar `input-otp` como base (padrao shadcn OTP input)
- Props: length (6), onComplete, error, disabled
- 6 campos individuais, auto-focus progressivo
- Suporte a colar codigo do clipboard
- `autocomplete="one-time-code"` para Web OTP API (OSD049)
- Backspace volta para campo anterior
- Animacao de shake em erro (CSS animation)

### 4. Criar componente OtpResendTimer

Conforme chegala-otp-login.md secao 4.3 e OSD047:

**Localizacao:** `src/components/auth/OtpResendTimer.tsx`

- Props: seconds (60), onResend
- Timer countdown (numerico ou circular)
- Botao "Enviar novamente" desabilitado durante countdown
- Ao zerar, botao fica ativo e com estilo destaque

### 5. Criar hook useOtpLogin

Conforme chegala-otp-login.md secao 8 e OSD040-OSD049:

**Localizacao:** `src/hooks/useOtpLogin.ts` em cada app

- State machine com steps: `"phone"` → `"code"`
- `sendCode(channel)` — POST /api/auth/otp/send via Ky. Se sucesso, avanca para step "code". Se 429, exibe erro de rate limit
- `verifyCode(code)` — POST /api/auth/otp/verify via Ky. Se sucesso, armazenar tokens via Supabase client (`supabase.auth.setSession()`) e navegar para home. Se erro, exibir mensagem contextual (OSD048)
- `resendCode()` — re-envia codigo, reinicia timer
- `canResend` e `resendCountdown` — controle de timer de 60s
- `isLoading`, `error` — estados de UI

### 6. Modificar LoginPage do app Motoboy

Conforme US001 e chegala-otp-login.md secao 2.1:

- Login primario: OTP WhatsApp (campo telefone)
- Link secundario: "Entrar com email e senha" abre formulario legado (fallback — OTP011)
- Step 1: PhoneInput + botao "Enviar codigo"
- Step 2: OtpInput + OtpResendTimer + mensagens de erro
- Animacao suave entre steps (OTP012)
- Apos verificacao, redirect para home (`/`)

### 7. Modificar LoginPage do app Lojista

Conforme US020, US021 e chegala-otp-login.md secao 2.2:

- Duas opcoes visíveis: "Entrar com WhatsApp" (default) e "Entrar com email"
- Se WhatsApp: mesmo fluxo do Motoboy
- Se Email: campo de email em vez de telefone, channel = "email"
- Fallback "Entrar com email e senha" mantido

### 8. Modificar LoginPage do app Central

Conforme chegala-otp-login.md secao 2.3:

- Login primario: OTP Email (campo email)
- Link secundario: "Entrar com email e senha" (fallback)
- Mesmo flow de 2 steps (email → codigo)

### 9. Integrar com AuthContext

Apos receber access_token e refresh_token do endpoint /api/auth/otp/verify, setar a sessao do Supabase client para que o `useAuth()` reconheca o usuario logado. Usar `supabase.auth.setSession({ access_token, refresh_token })`.

## Limites

- NAO remover o login email+senha existente — manter como fallback acessivel (OTP011)
- NAO implementar backend — os endpoints sao do PRP-003
- NAO implementar auto-cadastro na tela de login — isso e PRP-011
- NAO criar package compartilhado de UI — componentes ficam dentro de cada app (duplicacao aceitavel para 3 apps)
- NAO implementar envio real de OTP — apenas chamar o endpoint do backend
- NAO alterar AuthContext para remover Supabase auth — OTP integra via setSession no mesmo client
