# Chega.la - Design e Arquitetura Wave 6: Onboarding, Documentacao e Help Contextual

Decisoes tecnicas incrementais para onboarding guiado, guias de uso in-app e help contextual.

---

## Stack Incremental (Wave 6)

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| Animacoes | CSS transitions + Tailwind | Leve, sem dependencia extra. Transicoes entre steps < 300ms |
| Tooltips | Radix Tooltip (via shadcn/ui) | Ja disponivel no projeto. Acessivel. Hover + focus |
| Swipe (mobile) | Touch events nativo | Tutorial motoboy. Sem lib extra para 5 telas |
| Guias de uso | Paginas React internas | Roteadas como /docs/{papel}. Mesmo stack, sem infra extra |
| Persistencia onboarding | Backbone API + PostgreSQL | onboarding_progress table. React Query no front |

---

## Estrutura Incremental

```
apps/
├── central/src/
│   ├── components/
│   │   └── onboarding/
│   │       ├── SetupWizard.tsx          # Wizard 5 etapas
│   │       ├── WizardStep.tsx           # Step generico com animacao
│   │       ├── WizardProgress.tsx       # Barra de progresso / stepper
│   │       └── steps/
│   │           ├── WelcomeStep.tsx
│   │           ├── CompanyDataStep.tsx
│   │           ├── PricingStep.tsx
│   │           ├── TeamInviteStep.tsx
│   │           └── CompletedStep.tsx
│   ├── hooks/
│   │   └── useOnboarding.ts            # Estado do onboarding via React Query
│   └── pages/
│       └── DocsPage.tsx                # Guia do operador (/docs/central)
│
├── motoboy/src/
│   ├── components/
│   │   └── onboarding/
│   │       ├── Tutorial.tsx             # Tutorial 5 telas com swipe
│   │       ├── TutorialSlide.tsx        # Slide individual
│   │       └── DotsIndicator.tsx        # Indicador de posicao
│   ├── hooks/
│   │   └── useOnboarding.ts
│   └── pages/
│       └── DocsPage.tsx                # Guia do motoboy (/docs/motoboy)
│
├── lojista/src/
│   ├── components/
│   │   └── onboarding/
│   │       ├── GuidedOverlay.tsx        # Overlay com highlights
│   │       ├── HighlightStep.tsx        # Step individual com spotlight
│   │       └── PostOrderModal.tsx       # Modal do fluxo pos-pedido
│   ├── hooks/
│   │   └── useOnboarding.ts
│   └── pages/
│       └── DocsPage.tsx                # Guia do lojista (/docs/lojista)
│
├── backbone/src/
│   └── routes/
│       └── onboarding.ts               # GET/POST onboarding progress
│
packages/shared/schemas/src/
    └── onboarding.ts                    # Zod schemas compartilhados
```

---

## Fluxo de Onboarding — Arquitetura

### Deteccao de primeiro acesso

```
1. App carrega
2. useOnboarding() faz GET /api/onboarding/progress?flow={wizard|tutorial|guided_overlay}
3. Se nenhum step "completed" encontrado → primeiro acesso → mostrar onboarding
4. Se "completed" step existe → onboarding ja feito → pular
5. Se steps parciais existem → retomar do proximo step pendente
```

### Salvamento de progresso

```
1. Usuario completa step N
2. POST /api/onboarding/progress { flow, step_key, metadata }
3. React Query invalida cache de onboarding
4. UI avanca para step N+1
5. Se step_key = "completed" → marcar fluxo como finalizado
```

---

## Endpoints API

| Metodo | Path | Descricao |
|--------|------|-----------|
| GET | /api/onboarding/progress | Retorna steps completados do usuario autenticado. Query param: `flow` (opcional) |
| POST | /api/onboarding/progress | Registra step completado. Body: `{ flow, step_key, metadata? }` |
| DELETE | /api/onboarding/progress?flow={flow} | Reseta progresso de um fluxo (para "Reexecutar wizard") |

---

## Documentacao In-App

### Estrategia

Guias como paginas React internas (nao documentacao externa). Vantagens:

| Aspecto | Decisao | Justificativa |
|---------|---------|---------------|
| Hospedagem | Mesmo app (rota /docs/*) | Zero infra adicional. Deploy junto com o app |
| Formato | Componentes React | Permite links internos, navegacao do app, deep links |
| Conteudo | Hardcoded em componentes | Versao 1 simples. Internacionalizacao futura via i18n se necessario |
| Acessibilidade | Menu principal + header "?" | Maximo 1 click para acessar |

### Rotas

| App | Rota | Conteudo |
|-----|------|----------|
| Central | /docs/central | Guia do operador (12 secoes + FAQ) |
| Motoboy | /docs/motoboy | Guia do motoboy (10 secoes + FAQ + troubleshooting) |
| Lojista | /docs/lojista | Guia do lojista (8 secoes + FAQ) |

---

## Help Contextual — Implementacao

### Tooltip System

```
Componente: <HelpTooltip content="..." learnMoreUrl="..." />
- Renderiza icone "?" (lucide-react: HelpCircle, 16px)
- Radix Tooltip com max-width 240px
- Prop learnMoreUrl opcional → link "Saiba mais" no tooltip
- Hover trigger (desktop) + focus trigger (mobile/acessibilidade)
```

### Empty States

```
Componente existente: <Empty /> (apps/central/src/components/ui/)
Adicionar props opcionais:
- actionLabel: string     — texto do botao CTA
- actionHref: string      — link do CTA
- helpUrl: string         — link para guia relevante
```

### Header Help Icon

```
Componente: <PageHelpLink url="..." />
- Icone "?" no header de cada pagina
- Click navega para secao do guia via deep link (/docs/central#mapa)
```

---

## Convencoes de Codigo (Wave 6)

| Item | Convencao | Exemplo |
|------|-----------|---------|
| Componentes onboarding | PascalCase, pasta onboarding/ | `SetupWizard.tsx` |
| Hooks | camelCase, prefixo use | `useOnboarding.ts` |
| Step keys | snake_case | `company_data`, `gps_permission` |
| Rotas docs | /docs/{papel} | `/docs/central` |
| Tooltip content | Portugues, max 2 linhas | "Define de quanto em quanto tempo..." |

---

## Decisoes Tecnicas Vinculantes

| Decisao | Detalhe |
|---------|---------|
| Sem lib de tour/walkthrough | Tutorial e overlay sao simples o suficiente para implementar com CSS + estado local |
| Persistencia server-side | Onboarding progress salvo no banco via API. Nao depender apenas de localStorage |
| Guias como paginas React | Nao usar Markdown externo ou CMS. Conteudo hardcoded em componentes |
| Reset de onboarding via DELETE | Operador pode resetar wizard. Motoboy/lojista nao podem resetar (apenas rever) |
| Onboarding nao bloqueia uso | Todas as telas permitem skip/pular. Onboarding e educativo, nao gatekeeping |

---

## Rastreabilidade

| Componente | Requisitos |
|------------|------------|
| SetupWizard (Central) | OSD001-OSD015, RNF001, RNF005 |
| Tutorial (Motoboy) | OSD020-OSD031, RNF002, RNF005 |
| GuidedOverlay (Lojista) | OSD040-OSD047 |
| DocsPage (3 apps) | OSD060-OSD068, RNF004, RNF008 |
| HelpTooltip | OSD080-OSD082, OSD088, RNF003, RNF006 |
| Empty states | OSD083-OSD085 |
| PageHelpLink | OSD086, OSD087 |
