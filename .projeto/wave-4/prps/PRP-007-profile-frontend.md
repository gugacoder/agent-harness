---
status: current
wave: 4
session: wave-4--cc
---

# PRP-007 — Tela de Perfil (Frontend)

## Objetivo

Criar a PerfilPage em cada app (Central, Lojista, Motoboy) integrando formulario de edicao de perfil e componente de avatar, com campos role-specific e salvamento via PATCH /api/profiles/me.

## Execution Mode

`implementar`

## Contexto

Os tres apps frontend estao em `apps/central/`, `apps/lojista/` e `apps/motoboy/`. Cada app tem seu proprio roteador React Router v7 em `src/App.tsx`. Nenhum dos apps tem pagina de perfil atualmente.

O header de cada app exibe o nome do usuario e um avatar com iniciais. O header da Central esta em `apps/central/src/components/layout/Header.tsx` com dropdown que mostra nome, email, toggle de tema e logout.

O hook `useAuth()` em cada app fornece `user` (id, email, role, companyId) e `session`. Os dados de profile (full_name, phone, avatar_url) estao disponiveis via user_metadata do JWT ou precisam ser buscados via GET /api/profiles/me (PRP-005).

O frontend usa React Query para data fetching (`useQuery`, `useMutation`), Ky como HTTP client (configurado em `src/lib/api.ts`), e componentes shadcn (Input, Button, Label, Card, Switch). Validacao de formularios usa estado local com React.

O PRP-006 implementara os componentes de avatar (AvatarDisplay, AvatarUpload). O PRP-005 implementara o endpoint GET/PATCH /api/profiles/me.

## Especificacao

### 1. Criar hooks de profile em cada app

**`src/hooks/useProfile.ts`** em cada app:
- `useProfile()` — useQuery para GET /api/profiles/me. Retorna profile com dados base + role-specific
- `useUpdateProfile()` — useMutation para PATCH /api/profiles/me. Invalida cache de profile no sucesso

### 2. Criar PerfilPage no app Motoboy

Conforme US002 e US003, OSD060-OSD068, OSD070:

**Localizacao:** `apps/motoboy/src/pages/PerfilPage.tsx`

- Layout: pagina com scroll, card unico
- Topo: AvatarUpload (xl) com nome do usuario abaixo
- Formulario com campos: nome completo, telefone, tipo de veiculo (select: moto/bicicleta/carro), placa, CNH
- Pre-preenchido com dados atuais (OSD063)
- Validacao em tempo real nos campos (OSD068)
- Botao "Salvar" que chama PATCH /api/profiles/me
- Toast de confirmacao ao salvar (usar toast/sonner do shadcn)
- Apos upload de avatar, salvar avatar_url automaticamente

### 3. Criar PerfilPage no app Lojista

Conforme US022 e US023, OSD060-OSD068, OSD072:

**Localizacao:** `apps/lojista/src/pages/PerfilPage.tsx`

- Mesmo layout base do Motoboy
- Campos pessoais: nome completo, telefone
- Campos da loja: nome da loja (trade_name), endereco, horario de funcionamento (business_hours)
- Business hours: UI simples com dias da semana e horarios de abertura/fechamento (pode ser simplificado com inputs de hora para cada dia)

### 4. Criar PerfilPage no app Central

Conforme US048 e US049, OSD060-OSD068:

**Localizacao:** `apps/central/src/pages/PerfilPage.tsx`

- Campos: nome completo, telefone, email (readonly — mostrar email atual)
- AvatarUpload
- Sem campos role-specific (operador nao tem dados adicionais)

### 5. Adicionar rotas nos apps

Em cada `src/App.tsx`, adicionar rota `/perfil` apontando para PerfilPage. Rota protegida (dentro do layout autenticado).

### 6. Adicionar link de acesso no header/menu

Adicionar link "Meu Perfil" no menu/dropdown do header de cada app:
- Central: no dropdown do Header existente, adicionar item "Meu Perfil" que navega para /perfil
- Motoboy: adicionar opcao no menu/bottom nav para navegar a /perfil
- Lojista: adicionar opcao no menu para navegar a /perfil

### 7. Atualizar avatar no header

Apos upload de avatar via PerfilPage, o avatar exibido no header deve atualizar. Isso acontece naturalmente se o header lê de React Query (cache invalidado pelo useUpdateProfile).

## Limites

- NAO criar componentes de avatar — usar os componentes do PRP-006
- NAO implementar endpoints de backend — usar os endpoints do PRP-005
- NAO implementar verificacao de email via OTP na troca — escopo futuro
- NAO implementar edicao de email para motoboy/lojista — apenas operador ve email (readonly)
- NAO alterar a ConfiguracaoPage — esta pagina e do PRP-004
- NAO implementar logica de unicidade de telefone no frontend — a validacao final e no backend (PRP-005), mas exibir erro retornado pelo backend
