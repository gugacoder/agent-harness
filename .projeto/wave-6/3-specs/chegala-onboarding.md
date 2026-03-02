# Chega.la - Feature Spec: Onboarding

Onboarding guiado para os 3 apps: wizard de configuracao (Central), tutorial de primeiro uso (Motoboy) e overlay guiado (Lojista).

---

## 1. Objetivo

- Reduzir abandono no primeiro acesso com orientacao imediata
- Operador configura operacao completa em < 5 minutos via wizard
- Motoboy entende o app e fica online em < 1 minuto via tutorial
- Lojista cria primeiro pedido com confianca via overlay guiado
- Persistir progresso para reentrada e revisao

---

## 2. Estrategias

| Estrategia | Descricao | App | Implementacao |
|------------|-----------|-----|---------------|
| Setup Wizard | Wizard de 5 etapas no primeiro acesso | Central | Modal fullscreen com stepper |
| Tutorial Slides | Tutorial de 5 telas com swipe | Motoboy | Telas fullscreen com dots indicator |
| Guided Overlay | Overlay com spotlights sequenciais | Lojista | Overlay com recorte CSS + tooltips |
| Progress Persistence | Progresso salvo server-side | Todos | API /api/onboarding + tabela onboarding_progress |
| Re-access | Reacessar onboarding a qualquer momento | Todos | Menu de perfil / config |

---

## 3. Fluxos por Contexto

### 3.1 Central — Setup Wizard (operador)

```
Login (primeiro acesso)
  │
  ▼
┌──────────────────────────────────────────────────────────────┐
│  WIZARD DE CONFIGURACAO (5 etapas)                           │
│                                                              │
│  [1] Boas-vindas ──→ [2] Dados empresa ──→ [3] Pricing      │
│                                                              │
│  [3] Pricing ──→ [4] Convite equipe ──→ [5] Pronto!         │
│                                                              │
│  • Cada etapa salva progresso via POST /api/onboarding       │
│  • "Pular" disponivel em etapas 3 e 4                        │
│  • Navegacao livre (anterior/proximo)                        │
│  • Se sair, retoma na etapa pendente                         │
└──────────────────────────────────────────────────────────────┘
  │
  ▼
Dashboard (com checklist do que foi feito + o que falta)
```

**Etapa 1 — Boas-vindas (5s)**
- Titulo: "Bem-vindo ao Chega.la!"
- Subtitulo: "Vamos configurar sua operacao em 5 minutos."
- Animacao: fluxo visual pedido → motoboy → entrega
- Botao: "Comecar"

**Etapa 2 — Dados da empresa (1min)**
- Campos: nome, telefone, endereco (autocomplete), logo (crop)
- Pre-preencher se company ja tem dados parciais
- Validacao inline com Zod

**Etapa 3 — Tabela de precos (2min)**
- Template pre-configurado: "Preco por km (padrao)" selecionado
- Campos editaveis: valor base, valor por km
- Simulador: input km → output preco estimado
- Botao: "Pular — farei isso depois"

**Etapa 4 — Convide sua equipe (1min)**
- Dois campos: telefone/email motoboy + telefone/email lojista
- Envio de convite (placeholder — depende de invite system)
- Botao: "Pular — farei isso depois"

**Etapa 5 — Pronto! (5s)**
- Checkmark animado
- Checklist visual do que foi feito
- Lista do que falta (se pulou etapas)
- Link para guia completo
- Botao: "Ir para o dashboard"

### 3.2 Motoboy — Tutorial (primeiro login)

```
Login (primeiro acesso)
  │
  ▼
┌──────────────────────────────────────────────────────────────┐
│  TUTORIAL (5 telas — swipe horizontal)                       │
│                                                              │
│  [1] Boas-vindas ──→ [2] GPS ──→ [3] Como funciona          │
│                                                              │
│  [3] Como funciona ──→ [4] Status ──→ [5] Pronto!           │
│                                                              │
│  • Skip visivel em todas as telas                            │
│  • Dots indicator (● ● ○ ○ ○)                                │
│  • Swipe ou botao "Proximo"                                  │
│  • Progresso salvo por tela visualizada                      │
└──────────────────────────────────────────────────────────────┘
  │
  ▼
StatusPage (motoboy fica online se escolheu na tela 5)
```

**Tela 1 — Boas-vindas (3s)**
- Icone: motoboy animado no mapa
- "Voce e um entregador Chega.la!"
- "Vamos te preparar em 1 minuto"

**Tela 2 — Ativar localizacao (10s)**
- Icone GPS grande
- "Para receber entregas, precisamos saber onde voce esta"
- Botao: "Ativar localizacao" → navigator.geolocation
- Se negado: texto empatico + instrucao manual

**Tela 3 — Como funciona (15s)**
- 3 passos visuais com icones:
  1. "Fique online para receber entregas"
  2. "Aceite a entrega e va ate o local de coleta"
  3. "Entregue e confirme com foto + assinatura"

**Tela 4 — Seu status (5s)**
- Toggle visual: verde "Online" / vermelho "Offline"
- "Mude seu status a qualquer momento"

**Tela 5 — Pronto! (2s)**
- "Tudo certo!"
- Botao primario: "Ficar online agora" → ativa status + StatusPage
- Link secundario: "Ver mais tarde"

### 3.3 Lojista — Overlay Guiado (primeiro acesso)

```
Login (primeiro acesso) → NovaEntregaPage
  │
  ▼
┌──────────────────────────────────────────────────────────────┐
│  OVERLAY GUIADO (4 steps sobre a pagina real)                │
│                                                              │
│  [1] Endereco entrega ──→ [2] Destinatario                  │
│                                                              │
│  [2] Destinatario ──→ [3] Botao confirmar ──→ [4] Fluxo     │
│                                                              │
│  • Spotlight no elemento-alvo                                │
│  • Tooltip flutuante com instrucao                           │
│  • "Pular tour" discreto                                     │
│  • Progresso salvo por step                                  │
└──────────────────────────────────────────────────────────────┘
  │
  ▼
NovaEntregaPage (sem overlay — uso normal)
```

**Step 1 — Endereco de entrega**
- Spotlight no campo de endereco
- Tooltip: "Digite o endereco de entrega ou selecione um favorito"

**Step 2 — Destinatario**
- Spotlight nos campos nome + telefone
- Tooltip: "Informe o nome e telefone de quem vai receber"

**Step 3 — Botao confirmar**
- Spotlight no botao
- Tooltip: "Confirme e pronto! Um motoboy sera atribuido em instantes."

**Step 4 — Fluxo pos-pedido**
- Modal (nao spotlight): timeline visual
- Pedido criado → Motoboy atribuido → Coletando → A caminho → Entregue
- "Voce acompanha tudo em tempo real no mapa."

---

## 4. Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OB001 | O sistema deve detectar primeiro acesso por ausencia de step "completed" no fluxo correspondente |
| OB002 | O sistema deve salvar cada step completado via POST /api/onboarding/progress |
| OB003 | O sistema deve retomar onboarding do proximo step pendente se usuario sair e voltar |
| OB004 | O wizard deve exibir stepper com numero da etapa atual e total |
| OB005 | O wizard deve permitir navegacao bidirecional entre etapas |
| OB006 | O wizard deve pre-preencher campos com dados existentes da empresa |
| OB007 | O tutorial deve suportar swipe horizontal entre telas |
| OB008 | O tutorial deve solicitar permissao GPS na tela 2 via Geolocation API |
| OB009 | O overlay deve calcular posicao do spotlight com base no elemento-alvo no DOM |
| OB010 | O overlay deve reposicionar tooltip automaticamente conforme espaco disponivel |
| OB011 | O operador deve poder resetar wizard via DELETE /api/onboarding/progress?flow=wizard |
| OB012 | O motoboy deve poder rever tutorial via menu de perfil (nao reseta progresso, apenas exibe) |
| OB013 | O lojista deve poder acessar "Como funciona" via menu (exibe modal do fluxo, step 4) |

---

## 5. Componentes

### 5.1 SetupWizard (Central)

**Localizacao:** `apps/central/src/components/onboarding/SetupWizard.tsx`

**Props:**
```typescript
interface SetupWizardProps {
  onComplete: () => void
  onSkip: () => void
}
```

**Comportamento:**
- Modal fullscreen com fundo semi-transparente
- Stepper horizontal no topo
- Animacao slide horizontal entre steps (200ms ease-out)
- Botoes: "Anterior", "Proximo", "Pular"
- Checkmark verde ao completar step
- Chama POST /api/onboarding/progress ao completar cada step

### 5.2 WizardStep (Central)

**Localizacao:** `apps/central/src/components/onboarding/WizardStep.tsx`

**Props:**
```typescript
interface WizardStepProps {
  stepNumber: number
  title: string
  children: React.ReactNode
  isCompleted: boolean
  isActive: boolean
}
```

### 5.3 WizardProgress (Central)

**Localizacao:** `apps/central/src/components/onboarding/WizardProgress.tsx`

**Props:**
```typescript
interface WizardProgressProps {
  currentStep: number
  totalSteps: number
  completedSteps: number[]
}
```

### 5.4 Tutorial (Motoboy)

**Localizacao:** `apps/motoboy/src/components/onboarding/Tutorial.tsx`

**Props:**
```typescript
interface TutorialProps {
  onComplete: (wentOnline: boolean) => void
  onSkip: () => void
}
```

**Comportamento:**
- Tela cheia com fundo suave
- Swipe horizontal via touch events
- Dots indicator no rodape
- Skip fixo no topo direito
- Botao "Ficar online agora" na ultima tela

### 5.5 TutorialSlide (Motoboy)

**Localizacao:** `apps/motoboy/src/components/onboarding/TutorialSlide.tsx`

**Props:**
```typescript
interface TutorialSlideProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}
```

### 5.6 DotsIndicator (Motoboy)

**Localizacao:** `apps/motoboy/src/components/onboarding/DotsIndicator.tsx`

**Props:**
```typescript
interface DotsIndicatorProps {
  total: number
  current: number
}
```

### 5.7 GuidedOverlay (Lojista)

**Localizacao:** `apps/lojista/src/components/onboarding/GuidedOverlay.tsx`

**Props:**
```typescript
interface GuidedOverlayProps {
  steps: OverlayStep[]
  onComplete: () => void
  onSkip: () => void
}

interface OverlayStep {
  targetSelector: string
  title: string
  description: string
  position?: "top" | "bottom" | "left" | "right"
}
```

**Comportamento:**
- Overlay com recorte CSS (clip-path) no elemento-alvo
- Tooltip flutuante posicionado automaticamente
- Botoes "Pular tour" e "Proximo"
- Recalcula posicao no resize

### 5.8 PostOrderModal (Lojista)

**Localizacao:** `apps/lojista/src/components/onboarding/PostOrderModal.tsx`

**Props:**
```typescript
interface PostOrderModalProps {
  open: boolean
  onClose: () => void
}
```

**Comportamento:**
- Modal com timeline visual do fluxo de entrega
- 5 estados na timeline: Criado → Atribuido → Coletando → A caminho → Entregue
- Texto explicativo abaixo da timeline
- Botao "Entendi"

---

## 6. Banco de Dados

```sql
CREATE TYPE "public"."onboarding_flow" AS ENUM('wizard', 'tutorial', 'guided_overlay');

CREATE TABLE "onboarding_progress" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "profile_id" uuid NOT NULL,
    "flow" "onboarding_flow" NOT NULL,
    "step_key" text NOT NULL,
    "metadata" jsonb,
    "completed_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_profile_id_profiles_id_fk"
    FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "idx_onboarding_profile_flow" ON "onboarding_progress"("profile_id", "flow");
CREATE UNIQUE INDEX "idx_onboarding_unique_step" ON "onboarding_progress"("profile_id", "flow", "step_key");
```

---

## 7. API Endpoints

**Localizacao:** `apps/backbone/src/routes/onboarding.ts`

```typescript
// GET /api/onboarding/progress?flow={flow}
// Retorna steps completados do usuario autenticado
export async function getOnboardingProgress(
  profileId: string,
  flow?: OnboardingFlow
): Promise<OnboardingStep[]>

// POST /api/onboarding/progress
// Registra step completado
export async function completeOnboardingStep(
  profileId: string,
  data: { flow: OnboardingFlow; step_key: string; metadata?: Record<string, unknown> }
): Promise<OnboardingStep>

// DELETE /api/onboarding/progress?flow={flow}
// Reseta progresso (apenas wizard — operador)
export async function resetOnboardingProgress(
  profileId: string,
  flow: OnboardingFlow
): Promise<void>
```

---

## 8. Hook

**Localizacao:** `apps/{app}/src/hooks/useOnboarding.ts`

```typescript
interface UseOnboardingReturn {
  isLoading: boolean
  completedSteps: string[]
  shouldShowOnboarding: boolean
  currentStep: string | null
  completeStep: (stepKey: string, metadata?: Record<string, unknown>) => Promise<void>
  resetProgress: () => Promise<void>
}

export function useOnboarding(flow: OnboardingFlow): UseOnboardingReturn
```

**Implementacao interna:**
- React Query: `useQuery(["onboarding", flow])` para GET
- React Query: `useMutation` para POST/DELETE com invalidacao
- `shouldShowOnboarding`: true se "completed" nao esta em completedSteps
- `currentStep`: primeiro step definido que nao esta em completedSteps

---

## 9. Integracao

### Central — App.tsx ou layout

```tsx
function CentralApp() {
  const { shouldShowOnboarding } = useOnboarding("wizard")

  return (
    <>
      {shouldShowOnboarding && (
        <SetupWizard
          onComplete={() => navigate("/dashboard")}
          onSkip={() => navigate("/dashboard")}
        />
      )}
      <Outlet />
    </>
  )
}
```

### Motoboy — App.tsx ou layout

```tsx
function MotoboyApp() {
  const { shouldShowOnboarding } = useOnboarding("tutorial")

  return (
    <>
      {shouldShowOnboarding && (
        <Tutorial
          onComplete={(wentOnline) => {
            if (wentOnline) setStatus("available")
            navigate("/status")
          }}
          onSkip={() => navigate("/status")}
        />
      )}
      <Outlet />
    </>
  )
}
```

### Lojista — NovaEntregaPage.tsx

```tsx
function NovaEntregaPage() {
  const { shouldShowOnboarding, completeStep } = useOnboarding("guided_overlay")

  return (
    <>
      {shouldShowOnboarding && (
        <GuidedOverlay
          steps={[
            { targetSelector: "#delivery-address", title: "Endereco de entrega", description: "Digite o endereco ou selecione um favorito" },
            { targetSelector: "#recipient-fields", title: "Destinatario", description: "Informe nome e telefone de quem vai receber" },
            { targetSelector: "#confirm-button", title: "Confirmar", description: "Confirme e pronto! Um motoboy sera atribuido." },
          ]}
          onComplete={() => completeStep("completed")}
          onSkip={() => completeStep("completed")}
        />
      )}
      {/* formulario de nova entrega */}
    </>
  )
}
```

### Config — Reexecutar wizard

```tsx
// Em ConfiguracaoPage.tsx
<Button variant="outline" onClick={async () => {
  await resetProgress()
  navigate("/") // wizard aparece automaticamente
}}>
  Reexecutar configuracao inicial
</Button>
```

---

## 10. Rastreabilidade

| Componente | Requisitos OSD | Requisitos OB |
|------------|----------------|---------------|
| SetupWizard | OSD001-OSD015 | OB001-OB006, OB011 |
| WizardStep | OSD013, OSD014, OSD015 | OB004, OB005 |
| WizardProgress | OSD013 | OB004 |
| Tutorial | OSD020-OSD031 | OB001-OB003, OB007, OB008, OB012 |
| TutorialSlide | OSD024, OSD025 | — |
| DotsIndicator | OSD028 | — |
| GuidedOverlay | OSD040-OSD047 | OB001-OB003, OB009, OB010, OB013 |
| PostOrderModal | OSD044, OSD045 | — |
| useOnboarding | OSD011, OSD029, OSD046 | OB001-OB003 |
| API onboarding | OSD011, OSD012 | OB002, OB011 |

---

## 11. Metricas de Sucesso

| Metrica | Meta |
|---------|------|
| Taxa de conclusao do wizard (Central) | > 70% completam todas 5 etapas |
| Taxa de conclusao do tutorial (Motoboy) | > 80% chegam na tela 5 |
| Taxa "Ficar online agora" (Motoboy) | > 50% ativam status na ultima tela |
| Taxa de conclusao do overlay (Lojista) | > 60% visualizam todos 4 steps |
| Tempo medio do wizard | < 5 minutos |
| Tempo medio do tutorial | < 1 minuto |
| Taxa de abandono primeiro dia (pos wave-6) | Reducao de 30% vs baseline |
| Tickets de suporte "como funciona" | Reducao de 50% vs baseline |
