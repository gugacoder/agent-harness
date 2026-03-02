---
status: current
wave: 4
session: wave-4--cc
---

# PRP-004 — Configuracao de Canais OTP (Backend + Central UI)

## Objetivo

Estender a API de company config com campos OTP (WhatsApp + SMTP) e adicionar secao de configuracao de canais na pagina de configuracao da Central.

## Execution Mode

`implementar`

## Contexto

A ConfiguracaoPage da Central (`apps/central/src/pages/ConfiguracaoPage.tsx`) ja existe com toggle de POD. Usa os hooks `useCompanyConfig()` e `useUpdateCompanyConfig()` em `apps/central/src/hooks/useCompanyConfig.ts`. O backend em `apps/backbone/src/routes/company-config.ts` tem GET e PATCH para company_configs.

O PRP-001 adicionara os campos OTP ao schema company_configs. O PRP-003 implementara whatsapp.service e smtp.service.

O frontend usa React Query para state management, Ky para HTTP, Tailwind + shadcn para UI, e Lucide para icones.

## Especificacao

### 1. Backend — Estender PATCH /api/company/config

No arquivo `apps/backbone/src/routes/company-config.ts`, estender o handler PATCH para aceitar e salvar os novos campos OTP:
- otp_whatsapp_enabled, otp_whatsapp_url, otp_whatsapp_api_key
- otp_smtp_enabled, otp_smtp_host, otp_smtp_port, otp_smtp_user, otp_smtp_pass_encrypted, otp_smtp_from, otp_smtp_tls

Para `otp_smtp_pass_encrypted`: receber senha em texto claro no request, criptografar server-side antes de salvar (usar crypto.createCipheriv com chave derivada de JWT_SECRET). No GET, retornar campo `otp_smtp_pass_set: boolean` em vez da senha — nunca retornar a senha criptografada ao frontend.

Para `otp_whatsapp_api_key`: mesmo tratamento — criptografar ao salvar, retornar `otp_whatsapp_api_key_set: boolean` no GET.

### 2. Backend — Endpoints de teste

Adicionar ao router de company-config:

- `POST /api/company/config/test-whatsapp` — requireRole('operator', 'super_admin'). Usa whatsapp.service (PRP-003) para enviar mensagem de teste "Teste de conexao Chega.la" para o telefone do operador logado (buscar profile.phone do user autenticado). Retorna `{ ok: true }` ou `{ error: "mensagem de erro" }`.

- `POST /api/company/config/test-smtp` — requireRole('operator', 'super_admin'). Usa smtp.service (PRP-003) para enviar email de teste para o email do operador (buscar em auth.users). Retorna `{ ok: true }` ou `{ error: "mensagem de erro" }`.

- `POST /api/company/config/detect-tls` — requireRole('operator', 'super_admin'). Recebe `{ host, port }`. Tenta conexao com TLS, depois sem TLS. Retorna `{ tls: boolean, success: boolean }`.

### 3. Frontend — Estender tipos

Em `apps/central/src/types/api.ts`, estender o tipo `CompanyConfig` com os campos OTP. Adicionar campos `otp_smtp_pass_set` e `otp_whatsapp_api_key_set` (boolean) em vez das credenciais.

### 4. Frontend — Estender ConfiguracaoPage

Adicionar duas novas secoes abaixo da secao de POD existente, conforme OSD120-OSD129 e US045-US047:

**Secao "WhatsApp (Evolution API)":**
- Toggle ativar/desativar
- Campo: URL da instancia
- Campo: API Key (type password, placeholder "••••••" se ja configurada)
- Texto informativo: numero de origem (se disponivel)
- Botao "Testar conexao" — chama POST /api/company/config/test-whatsapp, exibe feedback verde/vermelho
- Badge de status: verde "Configurado" se otp_whatsapp_enabled e otp_whatsapp_api_key_set, vermelho "Nao configurado" caso contrario

**Secao "Email (SMTP)":**
- Toggle ativar/desativar
- Campos: host, porta (sugestao 587), usuario, senha (type password), email remetente
- Botao "Detectar TLS" — chama POST /api/company/config/detect-tls, atualiza toggle TLS
- Botao "Enviar email de teste" — chama POST /api/company/config/test-smtp, exibe feedback
- Badge de status: verde/vermelho

Seguir o padrao visual da ConfiguracaoPage existente (cards com icone, titulo, descricao). Usar componentes shadcn existentes (Input, Switch, Button, Badge).

### 5. Frontend — Hooks

Estender `useUpdateCompanyConfig()` existente para incluir os novos campos. Adicionar hooks de mutation para os endpoints de teste:
- `useTestWhatsApp()` — POST /api/company/config/test-whatsapp
- `useTestSmtp()` — POST /api/company/config/test-smtp
- `useDetectTls()` — POST /api/company/config/detect-tls

## Limites

- NAO criar pagina nova — estender a ConfiguracaoPage existente
- NAO alterar a secao de POD existente
- NAO exibir credenciais no frontend — usar campos mascarados e flags *_set
- NAO implementar a logica de envio OTP real — apenas configurar e testar conexao
- NAO instalar bibliotecas de criptografia no frontend — a criptografia de credenciais e server-side
