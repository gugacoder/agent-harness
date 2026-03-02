---
status: current
wave: 6
depends_on: [PRP-001-onboarding-infra]
---

# PRP-003 — Onboarding Motoboy: Tutorial de Primeiro Uso

## Objetivo

Implementar tutorial de 5 telas no app Motoboy, exibido no primeiro login. Inclui slides com swipe, solicitacao de GPS, explicacao do fluxo e ativacao de status online.

## Execution Mode

`implementar`

## Contexto

### App Motoboy — estrutura existente

- Routing em `apps/motoboy/src/App.tsx`: React Router v7. Rotas protegidas: `RequireAuth` → `ActiveDeliveryProvider` → `AppShell` → `Outlet`. Rotas: `/` (Entregas), `/historico`, `/extrato`, `/status`.
- Layout: `AppShell` mobile-first (`max-w-[480px]`), header sticky (56px), bottom nav fixo (64px).
- StatusPage: `pages/StatusPage.tsx` — toggle de status (available/offline) via `useCourierStatus`.
- useCourierStatus: `hooks/useCourierStatus.ts` — GET /api/couriers/me + PATCH status. Toggle available ↔ offline.
- useLocationSharing: `hooks/useLocationSharing.ts` — Geolocation API com `enableHighAccuracy: true`. Detecta permissao negada.
- EmptyState: `components/ui/EmptyState.tsx` — `{ icon, title, description }`.
- API client: `lib/api.ts` — ky com Bearer token.
- Bottom nav: 4 tabs (Entregas, Historico, Extrato, Status).

### Dependencia

PRP-001 deve estar implementado (API /api/onboarding/progress disponivel).

## Especificacao

### 1. Hook useOnboarding

Criar `apps/motoboy/src/hooks/useOnboarding.ts`.

Mesmo padrao do PRP-002, mas com flow `"tutorial"` e step keys:
`["welcome", "gps_permission", "how_it_works", "status_explained", "completed"]`.

Query key: `["onboarding", "tutorial"]`.

### 2. Componentes

Criar pasta `apps/motoboy/src/components/onboarding/` com:

**Tutorial.tsx** — componente principal
- Tela cheia (`fixed inset-0 z-50 bg-background`).
- Container `max-w-[480px] mx-auto h-full`.
- Renderiza TutorialSlide ativo com animacao de slide horizontal.
- Swipe horizontal via touch events (`touchstart`, `touchmove`, `touchend`). Threshold: 50px de deslocamento para trocar slide.
- Botao "Pular" fixo no topo direito (`absolute top-4 right-4`).
- DotsIndicator fixo no rodape.
- Ao completar cada slide visualizado: chama `completeStep(stepKey)`.
- "Pular" chama `completeStep("completed")` e executa `onSkip`.

**TutorialSlide.tsx** — slide individual
- Props: `{ icon: ReactNode, title: string, description: string, action?: { label, onClick } }`
- Layout: flex col, items-center, justify-center, h-full, px-6, text-center.
- Icone: `mb-6`, 48px.
- Titulo: `text-xl font-semibold mb-2`.
- Descricao: `text-sm text-muted-foreground`, max 2 linhas.
- Acao (se existir): Button `mt-8 w-full`.

**DotsIndicator.tsx** — indicador de posicao
- Props: `{ total: number, current: number }`
- Circulos de 8px. Ativo: `bg-primary`. Inativo: `bg-muted-foreground/30`.
- Gap de 8px entre circulos. Centralizado.

### 3. Conteudo dos 5 slides

**Slide 0 — welcome**
- Icone: `Bike` (lucide-react), `text-primary`
- Titulo: "Voce e um entregador Chega.la!"
- Descricao: "Vamos te preparar em 1 minuto"
- Sem acao

**Slide 1 — gps_permission**
- Icone: `MapPin` (lucide-react), `text-primary`
- Titulo: "Ative sua localizacao"
- Descricao: "Para receber entregas, precisamos saber onde voce esta"
- Acao: botao "Ativar localizacao"
- Ao clicar: chama `navigator.geolocation.getCurrentPosition()` para triggerar permissao do browser
- Se concedido: metadata `{ granted: true }`, avanca automaticamente
- Se negado: exibe texto secundario "Voce pode ativar depois em Configuracoes do celular > Permissoes > Localizacao". Metadata `{ granted: false }`. NAO bloqueia — usuario pode avancar.

**Slide 2 — how_it_works**
- Icone: nenhum no topo
- Titulo: "Como funciona"
- 3 itens verticais com icone + texto:
  1. `Smartphone` — "Fique online para receber entregas"
  2. `Package` — "Aceite a entrega e va ate o local de coleta"
  3. `CheckCircle` — "Entregue e confirme com foto + assinatura"
- Cada item: flex row, gap-3, icone 24px, texto text-sm

**Slide 3 — status_explained**
- Icone: `ToggleRight` (lucide-react)
- Titulo: "Seu status"
- Dois blocos visuais:
  - Circulo verde + "Online" + "Voce pode receber entregas"
  - Circulo vermelho + "Offline" + "Voce nao recebera entregas"
- Descricao: "Mude seu status a qualquer momento"

**Slide 4 — completed**
- Icone: `CheckCircle` (lucide-react), `text-green-500`, 64px
- Titulo: "Tudo certo!"
- Descricao: "Fique online para receber sua primeira entrega"
- Acao primaria: botao "Ficar online agora"
  - Ao clicar: chama `completeStep("completed", { went_online: true })`, depois muda status para `available` via `useCourierStatus` e navega para `/status`
- Link secundario (text button): "Ver mais tarde"
  - Ao clicar: chama `completeStep("completed", { went_online: false })` e navega para `/status`

### 4. Integracao com App.tsx

Dentro da estrutura de rotas protegidas (apos `RequireAuth`, antes ou dentro de `AppShell`):

```
const { shouldShowOnboarding } = useOnboarding("tutorial")

{shouldShowOnboarding && (
  <Tutorial
    onComplete={(wentOnline) => {
      if (wentOnline) { /* ativar status via useCourierStatus */ }
      navigate("/status")
    }}
    onSkip={() => navigate("/status")}
  />
)}
```

O tutorial renderiza ACIMA do app (z-50). Cobre a tela inteira.

### 5. Menu "Rever tutorial"

Adicionar opcao no menu de perfil (header ou status page):
- Texto: "Rever tutorial"
- Ao clicar: abre o Tutorial em modo "review" — exibe todas as telas mas NAO reseta progresso e NAO salva steps novamente. Apenas navegacao visual.
- Implementar via prop `reviewMode?: boolean` no Tutorial. Em reviewMode, nao chama completeStep.

### 6. Animacoes

- Slide horizontal: `transform: translateX()` acompanhando swipe com spring 200ms
- Dots: transition de cor 150ms
- CheckCircle na tela final: scale-in 300ms
- Botao "Ficar online": pulse suave para chamar atencao

## Limites

- NAO instalar bibliotecas de carousel ou swipe. Implementar com touch events nativos.
- NAO alterar StatusPage existente alem de adicionar link "Rever tutorial".
- NAO alterar o fluxo de ActiveDeliveryProvider. Tutorial renderiza antes/acima.
- NAO criar componentes UI genericos. Usar HTML + Tailwind direto.
- NAO adicionar dependencias npm.
- NAO bloquear uso do app. Skip sempre disponivel.
- NAO solicitar permissao de camera ou notificacao neste tutorial. Apenas GPS.
