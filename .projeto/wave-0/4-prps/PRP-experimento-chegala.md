---
status: current
---

# PRP — Experimento Chega.la

## O que e este experimento

Construir o Chega.la — app de entregas para empresarios de entregas rapidas — iterativamente, sem definicao previa de "pronto". O produto emerge wave a wave ate o researcher concluir que nao ha mais incremento relevante.

## Como funciona

O experimento alterna entre dois harness encadeados:

```
A(wave-1) → B(wave-1) → A(wave-2) → B(wave-2) → ... → A(wave-N) → STOP
```

| Harness | Template | Papel |
|---|---|---|
| **A** | `.projeto/wave-0/3-specs/template-harness-A.md` | Research, decision, derive specs, derive PRPs do app, disparar B |
| **B** | `.projeto/wave-0/3-specs/template-harness-B.md` | Implementar PRPs do app, testar, corrigir, disparar A da wave seguinte |

Cada harness e flat, single-level, independente. Ao terminar, dispara o proximo seguindo o template correspondente.

## Estrutura de waves

```
.projeto/
  wave-0/            ← brainstorming original, guides, specs, este PRP (nao muda)
  wave-1/
    research/        ← brainstorming, pain/gain
    ranking.json     ← ranking acumulado (memoria do experimento)
    specs/           ← specs tecnicas do app
    prps/            ← PRPs do app + PRP-wave-1-close.md
  wave-2/
    research/
    ranking.json
    specs/
    prps/
```

## Documentos de referencia

Todo agente DEVE ler antes de iniciar qualquer tarefa:

| Documento | Path |
|---|---|
| Objetivo Norte | `.projeto/wave-0/1-brainstoming/draft-objetivo-norte.md` |
| Documento Comercial | `.projeto/wave-0/1-brainstoming/documentos/chega.la.md` |
| Landing Page | `.projeto/wave-0/1-brainstoming/documentos/LANDING_PAGE.md` |
| Concorrente | `.projeto/wave-0/1-brainstoming/documentos/Concorrente - Entregas Expressas.md` |
| Brand Assets | `.projeto/wave-0/1-brainstoming/documentos/BRAND.md` |
| Infraestrutura | `.projeto/wave-0/1-brainstoming/draft-design-infraestrutura.md` |
| Stack Tecnica | `.projeto/wave-0/1-brainstoming/draft-stack-backbone-schemas.md` |
| PRP Scope | `.projeto/wave-0/3-specs/chegala-prp-scope.md` |
| Template Harness A | `.projeto/wave-0/3-specs/template-harness-A.md` |
| Template Harness B | `.projeto/wave-0/3-specs/template-harness-B.md` |

## O encadeamento

### Harness A termina → dispara Harness B

A ultima feature do Harness A (F-005) cria um PRP de encadeamento (`PRP-wave-{N}-close.md`) seguindo o template B, e dispara o primeiro PRP da wave. Detalhes em `template-harness-A.md`.

### Harness B termina → dispara Harness A

O PRP de encadeamento (`PRP-wave-{N}-close.md`) e o ultimo a ser processado. Sua feature final faz git tag, e dispara o Harness A para wave N+1 usando ESTE PRP. Detalhes em `template-harness-B.md`.

### Parada

O Harness A, no F-002 (decision), pode decidir STOP. Neste caso, todas as features restantes sao marcadas `skipped` e o experimento encerra. O threshold nao e um valor fixo — e uma conclusao emergente do researcher baseada no ranking acumulado.

## O Produto: Chega.la

App para empresas de entregas rapidas. Tres modulos sincronizados via SSE:

| Modulo | Usuario | Funcao |
|---|---|---|
| Central da Empresa | Operador/gestor | Painel: pedidos, entregas, motoboys, financeiro |
| App do Lojista | Cliente da empresa | Solicitar e acompanhar entregas |
| App do Motoboy | Entregador | Gerenciar entregas, rotas, localizacao real-time |

### Branding — OBRIGATORIO

Logo SVG (nunca texto generico), cores Primary #222e6e, Secondary #1dace7, Accent #fca322.

### Regras de infraestrutura

- Zod source of truth em `packages/shared/schemas/`
- REST para acoes, SSE para sync — sem polling
- Supabase self-hosted (PostgreSQL, GoTrue, Storage)
- Hono + @hono/zod-openapi para API
- Drizzle ORM para banco
- Production-ready desde o inicio: seeds (`npm run db:seed`), nunca mocks

## Limites

- NAO implementar codigo do app no Harness A — responsabilidade do Harness B
- NAO modificar scripts do harness (loop.mjs, run.mjs, agentes)
- NAO criar schemas Zod para artefatos do harness
- PRPs gerados pelo Harness A sao SEMPRE sobre o app, nunca sobre o harness
- O ranking.json cresce a cada wave — discoveries sao reclassificadas, nunca removidas

## Como iniciar (wave 1)

```bash
vibe:worktree .projeto/wave-0/4-prps/PRP.md --session wave-1-research
vibe:plan
vibe:spawn
```

O vibe:plan le este PRP e segue o template-harness-A.md para gerar as features. A partir dai, o ciclo e autonomo.
