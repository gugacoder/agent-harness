---
status: current
wave: 6
depends_on: [PRP-001-onboarding-infra]
---

# PRP-002 — Onboarding Central: Setup Wizard

## Objetivo

Implementar wizard de configuracao inicial em 5 etapas no app Central, exibido no primeiro acesso do operador. Inclui componentes UI, hook de estado e integracao com layout existente.

## Execution Mode

`implementar`

## Contexto

### App Central — estrutura existente

- Routing em `apps/central/src/App.tsx`: React Router v7, rotas protegidas dentro de `RequireAuth` → `AppShell` → `Outlet`.
- Layout: `AppShell` (sidebar responsiva + header + bottom nav). Componentes em `components/layout/`.
- Hooks: padrao `useQuery`/`useMutation` com `api` client (ky). Exemplos: `useCompanyConfig`, `useOrders`.
- API client: `apps/central/src/lib/api.ts` — ky com prefixUrl e Bearer token via Supabase.
- EmptyState existente: `components/ui/EmptyState.tsx` — aceita `{ icon, title, description?, action? }`.
- ConfiguracaoPage: `pages/ConfiguracaoPage.tsx` — pagina de configuracoes ja existente.
- Pricing hooks: `usePricingTables`, `usePricingRules` — manipulacao de tabelas de preco ja implementada.
- Company hooks: `useCompanyConfig` — leitura/atualizacao de config da empresa.

### Dependencia

PRP-001 deve estar implementado (API /api/onboarding/progress disponivel).

## Especificacao

### 1. Hook useOnboarding

Criar `apps/central/src/hooks/useOnboarding.ts`.

Conforme `chegala-onboarding.md` secao 8:

| Propriedade | Tipo | Descricao |
|------------|------|-----------|
| isLoading | boolean | Query em andamento |
| completedSteps | string[] | Step keys ja completados |
| shouldShowOnboarding | boolean | true se "completed" nao esta em completedSteps |
| currentStep | string \| null | Proximo step pendente na sequencia |
| completeStep | (key, metadata?) => Promise | Chama POST /api/onboarding/progress |
| resetProgress | () => Promise | Chama DELETE /api/onboarding/progress?flow=wizard |

Step keys na ordem: `["welcome", "company_data", "pricing", "team_invite", "completed"]`.
Query key: `["onboarding", "wizard"]`.

### 2. Componentes

Criar pasta `apps/central/src/components/onboarding/` com:

**SetupWizard.tsx** — componente principal
- Modal fullscreen (`fixed inset-0 z-50`) com fundo semi-transparente (`bg-black/50`)
- Card centralizado `max-w-2xl`
- Renderiza WizardProgress no topo e step ativo no conteudo
- Botoes no rodape: "Anterior" (ghost, disabled no step 0), "Pular" (ghost, visivel nos steps 2 e 3), "Proximo" (primary)
- Transicao entre steps: CSS transition slide horizontal 200ms ease-out
- Ao completar cada step: chama `completeStep(stepKey, metadata)`
- Ao finalizar step 5: chama `completeStep("completed")` e executa `onComplete`

**WizardProgress.tsx** — stepper horizontal
- Props: `{ currentStep: number, totalSteps: number, completedSteps: number[] }`
- Exibe numeros 1-5 em circulos. Circulo ativo: `bg-primary text-primary-foreground`. Completado: `bg-green-500 text-white` com icone Check. Pendente: `bg-muted text-muted-foreground`.
- Linha conectora entre circulos.

**steps/WelcomeStep.tsx** — etapa 1
- Titulo: "Bem-vindo ao Chega.la!"
- Subtitulo: "Vamos configurar sua operacao em 5 minutos."
- Icone ou ilustracao simples do fluxo (Package → Bike → CheckCircle) usando icones Lucide.
- Botao unico: "Comecar" (equivale a "Proximo").

**steps/CompanyDataStep.tsx** — etapa 2
- Formulario com react-hook-form + Zod:
  - `name` (text, required)
  - `phone` (text, required)
  - `address` (text, required — usar input simples, autocomplete e escopo de wave-5)
  - `logo_url` (text, opcional — campo de URL ou placeholder)
- Pre-preencher com dados existentes da empresa (GET /api/companies via hook existente ou contexto).
- Ao clicar "Proximo": salva dados via PATCH /api/companies se alterados, depois completa step.

**steps/PricingStep.tsx** — etapa 3
- Exibir template pre-selecionado "Preco por km (padrao)".
- Campos editaveis: valor base (R$), valor por km (R$).
- Simulador inline: input de km → calculo de preco estimado em tempo real.
- Se empresa ja tem tabela de precos ativa, pre-preencher valores.
- Ao clicar "Proximo": cria ou atualiza pricing table via API existente, depois completa step com metadata `{ template_used: boolean }`.
- Botao "Pular" disponivel. Completa step com metadata `{ skipped: true }`.

**steps/TeamInviteStep.tsx** — etapa 4
- Dois campos simples: telefone/email motoboy, telefone/email lojista.
- Implementacao placeholder: ao "Proximo", salva metadata `{ skipped: false, invited_count: N }` mas NAO envia convite real (sistema de convites nao existe ainda). Exibir texto "Convites serao enviados quando o sistema de convites estiver disponivel."
- Botao "Pular" disponivel. Completa step com metadata `{ skipped: true }`.

**steps/CompletedStep.tsx** — etapa 5
- Icone CheckCircle grande com animacao (scale-in + fade-in).
- Titulo: "Sua operacao esta configurada!"
- Checklist visual: lista de steps anteriores com checkmark verde (feito) ou circulo vazio (pulado).
- Se houve steps pulados: "Voce pode configurar isso a qualquer momento em Configuracao."
- Link para guia completo: "/docs/central" (rota do PRP-006).
- Botao: "Ir para o dashboard" → executa onComplete.

### 3. Integracao com App.tsx

Dentro do componente que renderiza `AppShell` (ou no proprio AppShell), adicionar:

```
const { shouldShowOnboarding } = useOnboarding("wizard")

{shouldShowOnboarding && (
  <SetupWizard onComplete={() => navigate("/")} onSkip={() => navigate("/")} />
)}
```

O wizard renderiza ACIMA do conteudo (z-50). O app continua funcionando por baixo.

### 4. Integracao com ConfiguracaoPage

Adicionar botao "Reexecutar configuracao inicial" (variant outline) em ConfiguracaoPage. Ao clicar:
1. Chama `resetProgress()` do hook
2. Navega para "/" (wizard aparece automaticamente)

### 5. Animacoes

- Transicao entre steps: `transform: translateX()` com transition 200ms ease-out
- Checkmark no step completo: scale-in 300ms com bounce
- Entrada do wizard: fade-in do overlay 200ms

## Limites

- NAO implementar sistema de convites real na etapa 4. Apenas UI com placeholder e metadata.
- NAO alterar rotas existentes. O wizard e um overlay sobre o app funcional.
- NAO bloquear o uso do app. O wizard tem "Pular" em todas as etapas e pode ser fechado.
- NAO criar componentes UI genericos (Button, Card, Input, etc). Usar elementos HTML + Tailwind diretamente, seguindo o padrao dos componentes existentes no projeto que nao usam shadcn/ui.
- NAO duplicar hooks de API existentes. Reusar `useCompanyConfig`, `usePricingTables` etc. para ler/salvar dados.
- NAO adicionar dependencias npm. Animacoes via CSS transitions.
- NAO implementar documentacao in-app (link para /docs/central e placeholder ate PRP-006).
