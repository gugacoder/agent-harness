---
status: finished
finished_at: 2026-03-02T23:50:00Z
wave: 6
depends_on: [PRP-001-onboarding-infra]
---

# PRP-004 — Onboarding Lojista: Overlay Guiado

## Objetivo

Implementar overlay guiado com spotlights sequenciais sobre a NovaEntregaPage no app Lojista, exibido no primeiro acesso. Inclui modal de fluxo pos-pedido com timeline visual.

## Execution Mode

`implementar`

## Contexto

### App Lojista — estrutura existente

- Routing em `apps/lojista/src/App.tsx`: React Router v7. Rotas protegidas: `RequireAuth` → `AppShell` → `Outlet`. Rotas: `/` (Pedidos), `/nova` (Nova Entrega), `/historico`, `/faturas`.
- NovaEntregaPage: `pages/NovaEntregaPage.tsx` — formulario com react-hook-form + Zod. 5 campos: pickup_address (pre-preenchido), delivery_address, recipient_name, recipient_phone, notes. Submissao via ConfirmDialog.
- Layout: AppShell com sidebar responsiva (desktop 56px, tablet 16px, mobile bottom nav).
- Hooks: useShop (dados da loja), useOrders (lista pedidos), useCompanyEvents (SSE).
- API client: `lib/api.ts` — ky com Bearer token.
- UI components: ConfirmDialog, ErrorAlert, StatusBadge, EmptyState, Skeleton.
- Bottom nav: 4 tabs (Pedidos, Nova Entrega, Historico, Faturas).

### Dependencia

PRP-001 deve estar implementado (API /api/onboarding/progress disponivel).

## Especificacao

### 1. Hook useOnboarding

Criar `apps/lojista/src/hooks/useOnboarding.ts`.

Mesmo padrao dos PRPs 002/003, com flow `"guided_overlay"` e step keys:
`["delivery_address", "recipient", "confirm_button", "post_order_flow", "completed"]`.

Query key: `["onboarding", "guided_overlay"]`.

### 2. Componentes

Criar pasta `apps/lojista/src/components/onboarding/` com:

**GuidedOverlay.tsx** — componente principal

Props:
```typescript
interface GuidedOverlayProps {
  steps: OverlayStep[]
  onComplete: () => void
  onSkip: () => void
}

interface OverlayStep {
  targetSelector: string      // CSS selector do elemento-alvo
  title: string
  description: string
  position?: "top" | "bottom" | "left" | "right"
}
```

Comportamento:
- Overlay fullscreen (`fixed inset-0 z-50`).
- Fundo escuro (`bg-black/60`) com recorte transparente ao redor do elemento-alvo.
- O recorte usa CSS `clip-path` ou SVG mask calculado a partir de `getBoundingClientRect()` do elemento-alvo.
- Margem de 8px ao redor do elemento no recorte (padding visual).
- Tooltip flutuante proximo ao elemento com seta direcional.
- Botoes no tooltip: "Pular tour" (ghost, text-xs) e "Proximo" (primary, sm).
- Ao avancar: chama `completeStep(stepKey)` para cada step.
- Recalcula posicao no `resize` e `scroll`.
- No step final (post_order_flow): nao usa spotlight, abre PostOrderModal.

**HighlightTooltip.tsx** — tooltip de cada step

Props:
```typescript
interface HighlightTooltipProps {
  title: string
  description: string
  position: { top: number, left: number }
  arrowDirection: "top" | "bottom" | "left" | "right"
  onNext: () => void
  onSkip: () => void
  stepNumber: number
  totalSteps: number
}
```

- Card com `bg-card rounded-lg p-4 shadow-lg max-w-xs`.
- Titulo: `text-sm font-medium`.
- Descricao: `text-xs text-muted-foreground mt-1`.
- Rodape: flex justify-between mt-3. "Pular tour" (ghost) e "Proximo" (primary).
- Indicador de step: "2/4" no topo direito do tooltip (text-xs text-muted-foreground).

**PostOrderModal.tsx** — modal do fluxo pos-pedido

Props:
```typescript
interface PostOrderModalProps {
  open: boolean
  onClose: () => void
}
```

- Modal centralizado com overlay escuro.
- Titulo: "O que acontece depois?"
- Timeline visual vertical com 5 estados:
  1. Circulo + "Pedido criado" — "Seu pedido foi registrado no sistema"
  2. Circulo + "Motoboy atribuido" — "O operador designa um motoboy para sua entrega"
  3. Circulo + "Coletando" — "O motoboy esta a caminho da sua loja"
  4. Circulo + "A caminho" — "O motoboy esta levando o pedido ao destino"
  5. Circulo + "Entregue" — "Pedido entregue com sucesso!"
- Cada estado: flex row, circulo com icone (Package, User, Bike, Navigation, CheckCircle), texto.
- Linha vertical conectando os circulos.
- Texto explicativo abaixo: "Voce acompanha tudo em tempo real no mapa."
- Botao: "Entendi" (primary, w-full, mt-6).

### 3. Configuracao dos steps

Definir steps inline no ponto de integracao:

| Step | targetSelector | title | description |
|------|---------------|-------|-------------|
| 0 | "#delivery-address" ou seletor equivalente do campo de endereco de entrega na NovaEntregaPage | Endereco de entrega | Digite o endereco de entrega ou selecione um favorito |
| 1 | "#recipient-name" ou container dos campos nome + telefone | Destinatario | Informe o nome e telefone de quem vai receber |
| 2 | seletor do botao de confirmacao/submit | Confirmar | Confirme e pronto! Um motoboy sera atribuido em instantes. |
| 3 | — (PostOrderModal em vez de spotlight) | — | — |

Para que os selectors funcionem, adicionar `id` nos elementos relevantes de NovaEntregaPage:
- `id="delivery-address"` no container/input do endereco de entrega
- `id="recipient-fields"` no container dos campos de destinatario
- `id="submit-button"` no botao de confirmacao

### 4. Integracao com NovaEntregaPage

Em `pages/NovaEntregaPage.tsx`, adicionar:

```
const { shouldShowOnboarding, completeStep } = useOnboarding("guided_overlay")
const [showPostOrderModal, setShowPostOrderModal] = useState(false)

// Apos o formulario existente:
{shouldShowOnboarding && !showPostOrderModal && (
  <GuidedOverlay
    steps={overlaySteps}
    onComplete={() => {
      completeStep("completed")
      setShowPostOrderModal(true)
    }}
    onSkip={() => completeStep("completed")}
  />
)}

{showPostOrderModal && (
  <PostOrderModal
    open={showPostOrderModal}
    onClose={() => {
      completeStep("post_order_flow")
      completeStep("completed")
      setShowPostOrderModal(false)
    }}
  />
)}
```

### 5. Menu "Como funciona"

Adicionar item no bottom nav ou menu lateral:
- Opcao acessivel a partir de qualquer pagina
- Ao clicar: abre PostOrderModal (reutiliza o componente)
- NAO reseta progresso do overlay

Implementacao sugerida: botao discreto no header ou item "Como funciona" no sidebar/bottom nav (conforme espaco disponivel). Pode ser um icone `HelpCircle` no header que abre o modal.

## Limites

- NAO alterar a logica do formulario de NovaEntregaPage. Apenas adicionar IDs nos elementos e o overlay por cima.
- NAO instalar bibliotecas de tour/walkthrough (react-joyride, shepherd, etc.). Implementar com CSS puro.
- NAO criar sistema de spotlight generico reutilizavel. Componente especifico para este fluxo de 4 steps.
- NAO bloquear o formulario. O overlay e visual — usuario pode fechar a qualquer momento.
- NAO adicionar dependencias npm.
- O overlay deve funcionar tanto em mobile (bottom nav) quanto desktop (sidebar). Recalcular posicoes conforme layout.
