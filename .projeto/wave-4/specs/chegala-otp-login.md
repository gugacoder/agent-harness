# Chega.la - Feature Spec: Login OTP (WhatsApp + Email)

Login passwordless via telefone/email + codigo de 6 digitos, com suporte a WhatsApp (Evolution API) e Email (SMTP).

---

## 1. Objetivo

- Eliminar atrito de login para motoboys (sem email/senha)
- Oferecer metodo de login padrao do mercado (telefone + OTP)
- Suportar dois canais: WhatsApp (primario) e Email (alternativo)
- Manter seguranca com rate limiting, hash de codigos e expiracao

---

## 2. Fluxos por Contexto

### 2.1 App Motoboy — OTP WhatsApp (primario)

```
[Tela Login]
    │
    ├─ Campo telefone (+55 mascara)
    ├─ Botao "Enviar codigo"
    │
    ▼
[POST /api/auth/otp/send { phone, channel: "whatsapp" }]
    │
    ├─ Rate limit OK? → gerar codigo → hash bcrypt → salvar otp_codes → enviar via Evolution
    ├─ Rate limit exceeded? → 429 "Aguarde X segundos"
    │
    ▼
[Tela Codigo OTP]
    │
    ├─ 6 campos individuais, auto-focus
    ├─ Timer countdown 60s para reenvio
    ├─ Web OTP API auto-detect
    │
    ▼
[POST /api/auth/otp/verify { phone, code }]
    │
    ├─ Codigo valido? → lookup profile by phone → emitir JWT → redirect home
    ├─ Codigo invalido? → erro inline, incrementar attempts
    ├─ Codigo expirado? → "Codigo expirado — enviar novamente"
    ├─ Max attempts? → invalidar codigo, pedir novo
```

### 2.2 App Lojista — OTP WhatsApp ou Email

```
[Tela Login]
    │
    ├─ "Entrar com WhatsApp" (default se configurado)
    ├─ "Entrar com email" (alternativa)
    │
    ▼
[Mesmo fluxo do 2.1, variando apenas o canal de envio]
```

### 2.3 App Central — OTP Email (primario para operadores)

```
[Tela Login]
    │
    ├─ Campo email
    ├─ Botao "Enviar codigo"
    │
    ▼
[POST /api/auth/otp/send { email, channel: "email" }]
    │
    ├─ Enviar email HTML via Nodemailer (SMTP configurado pela empresa)
    │
    ▼
[Mesma tela de codigo OTP do 2.1]
```

---

## 3. Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OTP001 | O sistema deve exibir tela de login com campo de telefone e opcao de email |
| OTP002 | O sistema deve validar formato de telefone brasileiro antes de enviar |
| OTP003 | O sistema deve gerar codigo aleatorio de 6 digitos (crypto.randomInt) |
| OTP004 | O sistema deve salvar hash bcrypt do codigo com TTL de 5 minutos em otp_codes |
| OTP005 | O sistema deve enviar codigo via Evolution API (POST /message/sendText) quando canal = whatsapp |
| OTP006 | O sistema deve enviar codigo via Nodemailer (SMTP) quando canal = email |
| OTP007 | O sistema deve limitar envios a 3/minuto por telefone via Redis counter com TTL 60s |
| OTP008 | O sistema deve limitar tentativas de verificacao a 5 por codigo gerado |
| OTP009 | O sistema deve emitir JWT via Supabase Admin API (admin.generateLink ou signInWithIdToken) apos verificacao |
| OTP010 | O sistema deve criar profile automaticamente se telefone pertence a um registration_request aprovado |
| OTP011 | O sistema deve manter fallback para login email+senha durante periodo de transicao |
| OTP012 | O sistema deve exibir animacao suave entre tela de telefone e tela de codigo |

---

## 4. Componentes

### 4.1 PhoneInput

**Localizacao:** `packages/shared/ui/src/phone-input.tsx` (ou inline no app)

```typescript
interface PhoneInputProps {
  value: string;
  onChange: (phone: string) => void;
  error?: string;
  disabled?: boolean;
}
```

**Comportamento:**
- Mascara brasileira automatica: (XX) XXXXX-XXXX
- Prefixo +55 fixo com bandeira BR
- `inputMode="tel"` para teclado numerico
- Validacao inline de formato

### 4.2 OtpInput

**Localizacao:** `packages/shared/ui/src/otp-input.tsx` (wrapper de input-otp)

```typescript
interface OtpInputProps {
  length: number; // 6
  onComplete: (code: string) => void;
  error?: string;
  disabled?: boolean;
}
```

**Comportamento:**
- 6 campos individuais, auto-focus progressivo
- Suporte a colar codigo do clipboard (paste handler)
- Web OTP API integration (`autocomplete="one-time-code"`)
- Backspace volta para campo anterior
- Animacao de shake em erro

### 4.3 OtpResendTimer

**Localizacao:** `packages/shared/ui/src/otp-resend-timer.tsx`

```typescript
interface OtpResendTimerProps {
  seconds: number; // 60
  onResend: () => void;
}
```

**Comportamento:**
- Countdown circular de 60 segundos
- Botao "Enviar novamente" desabilitado durante countdown
- Ao zerar, botao fica ativo

---

## 5. Banco de Dados

Tabela `otp_codes` — detalhada em `chegala-er.md`.

---

## 6. Endpoints

**Localizacao:** `apps/backbone/src/routes/auth.ts` (adicionar ao existente)

```typescript
// POST /api/auth/otp/send
export async function sendOtp(c: Context): Promise<Response>
// Input: { phone_or_email: string, channel: "whatsapp" | "email" }
// Output: { ok: true } | { error: string }

// POST /api/auth/otp/verify
export async function verifyOtp(c: Context): Promise<Response>
// Input: { phone_or_email: string, code: string }
// Output: { access_token: string, refresh_token: string, user: {...} }
```

---

## 7. Service

**Localizacao:** `apps/backbone/src/services/otp.service.ts`

```typescript
interface OtpService {
  generateAndSend(phoneOrEmail: string, channel: OtpChannel, companyId?: string): Promise<void>;
  verify(phoneOrEmail: string, code: string): Promise<{ userId: string; companyId: string }>;
}
```

**Dependencias:**
- `whatsapp.service.ts` — Evolution API client
- `smtp.service.ts` — Nodemailer wrapper
- Redis — rate limiting counters
- bcrypt — hash/compare

---

## 8. Hook Frontend

**Localizacao:** `packages/shared/hooks/src/use-otp-login.ts` (ou inline no app)

```typescript
interface UseOtpLoginReturn {
  step: "phone" | "code";
  phone: string;
  setPhone: (phone: string) => void;
  sendCode: (channel: OtpChannel) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  resendCode: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  canResend: boolean;
  resendCountdown: number;
}

export function useOtpLogin(): UseOtpLoginReturn
```

---

## 9. Integracao

```tsx
// apps/motoboy/src/pages/LoginPage.tsx
import { useOtpLogin } from "@chegala/hooks";
import { PhoneInput, OtpInput, OtpResendTimer } from "@chegala/ui";

function LoginPage() {
  const otp = useOtpLogin();

  if (otp.step === "phone") {
    return (
      <PhoneInput value={otp.phone} onChange={otp.setPhone} error={otp.error} />
      <Button onClick={() => otp.sendCode("whatsapp")} loading={otp.isLoading}>
        Enviar codigo
      </Button>
    );
  }

  return (
    <OtpInput length={6} onComplete={otp.verifyCode} error={otp.error} />
    <OtpResendTimer seconds={otp.resendCountdown} onResend={otp.resendCode} />
  );
}
```

---

## 10. Rastreabilidade

| Componente | Requisitos OSD | Requisitos OTP |
|------------|----------------|----------------|
| PhoneInput | OSD045 | OTP001, OTP002 |
| OtpInput | OSD046, OSD049 | OTP001 |
| OtpResendTimer | OSD047 | OTP012 |
| otp.service | OSD042-OSD044 | OTP003-OTP009 |
| whatsapp.service | OSD041 | OTP005 |
| smtp.service | OSD055-OSD056 | OTP006 |
| useOtpLogin | OSD045-OSD048 | OTP011, OTP012 |

---

## 11. Metricas de Sucesso

| Metrica | Meta |
|---------|------|
| Taxa de login via OTP vs email+senha | > 80% via OTP apos 30 dias |
| Tempo medio envio → verificacao | < 30 segundos |
| Taxa de codigos expirados | < 10% |
| Taxa de erro de envio WhatsApp | < 2% |
| Taxa de erro de envio Email | < 5% |
