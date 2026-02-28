# Chega.la - Protocolo de Execucao

Protocolo do macro harness que constroi o Chega.la iterativamente via waves autonomas de research, especificacao, implementacao e validacao.

---

## Visao Geral do Ciclo

```
┌─────────────────────────────────────────────────────────────────┐
│  MACRO HARNESS                                                  │
│                                                                 │
│  INIT: vibe:worktree → vibe:plan (gera Wave 1)                │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  WAVE N                                                  │   │
│  │                                                          │   │
│  │  Step 1: Research ──→ Gate 1 (threshold) ──┐            │   │
│  │                                     │       │            │   │
│  │                                    GO     STOP           │   │
│  │                                     │       │            │   │
│  │                                     ▼       ▼            │   │
│  │  Step 2: Derive Specs         Skip F2..F6               │   │
│  │       │                        + decision:"stop"         │   │
│  │       ▼                                                  │   │
│  │  Step 3: Derive PRPs                                     │   │
│  │       │                                                  │   │
│  │       ▼                                                  │   │
│  │  Step 4: Vibe (micro harness)                            │   │
│  │       │    └─ por PRP: worktree → plan → spawn → merge   │   │
│  │       ▼                                                  │   │
│  │  Step 5: Validate & Fix                                  │   │
│  │       │                                                  │   │
│  │       ▼                                                  │   │
│  │  Step 6: Close Wave ──→ Gate 2 (decision) ──┐           │   │
│  │                                      │       │           │   │
│  │                                     GO     STOP          │   │
│  │                                      │       │           │   │
│  └──────────────────────────────────────┼───────┼───────────┘   │
│                                         │       │               │
│                                         ▼       ▼               │
│                                    Wave N+1   FIM               │
│                                   (templated  (exit 0)          │
│                                    em F.json)                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Inicializacao

### PROT001 — Setup do Experimento

| Aspecto | Detalhe |
|---------|---------|
| Comando | `vibe:worktree` + `vibe:plan` |
| Agente | Operador humano (unica intervencao) |
| Pre-condicao | Repo com `.harness/agents/`, `.claude/commands/vibe/`, EXPERIMENTO.md |
| Pos-condicao | Worktree isolada, config.json, features.json com Wave 1 (F-001..F-006), progress.txt |
| Error handling | Se worktree falhar: retry manual. Se plan falhar: verificar PRP e retry |

O operador executa `vibe:worktree` para criar worktree isolada e `vibe:plan` para decompor o EXPERIMENTO em features.json da Wave 1. A partir daqui, o harness opera autonomamente.

---

## Wave Template

Cada wave segue a mesma anatomia de 6 steps. O features.json e vivo — cresce a cada wave.

### PROT002 — Step 1: Research

| # | Step | Agente | Pre-condicao | Pos-condicao | Error Handling |
|---|------|--------|--------------|--------------|----------------|
| 1 | Research dores/ganhos | researcher | config.json existe; docs de referencia acessiveis; ranking.json da wave anterior (se existir) | brainstorming.md criado em `wave-N/`; ranking.json atualizado com novas descobertas e reclassificacoes | Retry 1x com prompt ajustado; se falhar, abort wave |

**Detalhamento:**
- Ler TODOS os documentos de referencia listados no EXPERIMENTO.md
- Ler ranking.json acumulado (se existir) para nao redescobrir
- Investigar dores e ganhos do cliente-alvo (empresarios de entregas rapidas)
- Analisar concorrentes e alternativas
- Produzir `{runs_dir}/wave-N/brainstorming.md`
- Atualizar `{runs_dir}/ranking.json` com score 1-10 por descoberta

### PROT003 — Gate 1: Reflexao de Threshold

| Condicao | GO | STOP |
|----------|----|------|
| Primeiras waves (massa critica insuficiente) | Prosseguir sem avaliar threshold | N/A (nunca STOP nas primeiras waves) |
| Descobertas desta wave incluem items > 7 nao implementados | Prosseguir para Step 2 | N/A |
| Descobertas moderadas (3-7) que combinadas mudam o produto | Prosseguir para Step 2 | N/A |
| Todas as descobertas novas < 3 e nada > 7 pendente | N/A | Marcar F-XX2..F-XX6 como `skipped`; gravar `decision: "stop"` em ranking.json |

**Protocolo de reflexao** (executado pelo researcher ao final do Step 1):
1. Quantidade de waves e suficiente para avaliar threshold?
2. Se sim: pontuar todos os pain/gain acumulados (1-10)
3. Classificar descobertas desta wave: irrelevantes (<3), moderadas (3-7), criticas (>7)
4. Decidir: incremento relevante a vista?

### PROT004 — Step 2: Derivar Specs

| # | Step | Agente | Pre-condicao | Pos-condicao | Error Handling |
|---|------|--------|--------------|--------------|----------------|
| 2 | Derivar specs | general | brainstorming.md da wave existe; ranking.json com `decision: "go"` | Specs gerados em `wave-N/specs/` | Retry 1x; se falhar, abort wave |

**Detalhamento:**
- Usar skill `derive:specs` apontando para `wave-N/brainstorming.md`
- Priorizar descobertas com score mais alto do ranking.json
- Specs devem referenciar documentos de infraestrutura e stack

### PROT005 — Step 3: Derivar PRPs

| # | Step | Agente | Pre-condicao | Pos-condicao | Error Handling |
|---|------|--------|--------------|--------------|----------------|
| 3 | Derivar PRPs | general | Specs da wave existem em `wave-N/specs/` | PRPs gerados em `wave-N/prps/`; cada PRP auto-contido e implementavel | Retry 1x; se falhar, abort wave |

**Detalhamento:**
- Usar skill `derive:prps` apontando para `wave-N/specs/`
- Cada PRP deve ser executavel por um agente coder sem contexto adicional

### PROT006 — Step 4: Vibe (Implementacao via Micro Harness)

| # | Step | Agente | Pre-condicao | Pos-condicao | Error Handling |
|---|------|--------|--------------|--------------|----------------|
| 4 | Implementar PRPs | coder | PRPs existem em `wave-N/prps/` | Codigo implementado e comitado; worktrees de nivel 2 merged | Se PRP falhar (deadlock/conflito): log em progress.txt, continuar com demais PRPs |

**Detalhamento — dois niveis de harness:**

```
repo principal
└── .harness/worktrees/{macro-session}/              ← worktree do macro (nivel 1)
    └── .harness/worktrees/{prp-session}/            ← worktree do micro (nivel 2)
```

Para cada PRP, sequencialmente:
1. `vibe:worktree {prp}` — criar worktree isolada
2. `vibe:plan {prp}` — decompor PRP em features atomicas
3. `vibe:spawn {prp}` — spawnar loop de implementacao
4. Monitorar ate conclusao (`loop.json → exit_reason`)
5. `vibe:merge {prp}` — merge de volta na worktree do macro

### PROT007 — Step 5: Validar e Corrigir

| # | Step | Agente | Pre-condicao | Pos-condicao | Error Handling |
|---|------|--------|--------------|--------------|----------------|
| 5 | Validar e corrigir | coder | Codigo implementado (Step 4 concluido) | Todos os testes passing; branding verificado (logo SVG, cores #222e6e/#1dace7/#fca322) | Loop de correcao ate passing; se irrecuperavel, log e prosseguir |

**Detalhamento:**
- Rodar testes unitarios, integracao e e2e
- Verificar branding aplicado (nao generico)
- Identificar falhas → corrigir → re-testar ate passing
- O agente NAO apenas reporta erros — ele os resolve

### PROT008 — Step 6: Fechar Wave

| # | Step | Agente | Pre-condicao | Pos-condicao | Error Handling |
|---|------|--------|--------------|--------------|----------------|
| 6 | Fechar wave | general | Validacao concluida (Step 5); ranking.json com campo `decision` | Git tag `wave-N` criado; se GO: features.json expandido com Wave N+1; se STOP: progress.txt com encerramento | Se tag falhar: retry; se templateamento falhar: retry 1x |

### PROT009 — Gate 2: Decisao de Continuidade

| Condicao | GO | STOP |
|----------|----|------|
| `ranking.json.decision === "go"` | Adicionar F-XX1..F-XX6 ao features.json (proxima wave); atualizar progress.txt | N/A |
| `ranking.json.decision === "stop"` | N/A | Registrar encerramento em progress.txt; loop.mjs encerra naturalmente (tudo passing/skipped) |

---

## Auto-Alimentacao

### PROT010 — Templateamento de Proxima Wave

Executado pelo general (Step 6) quando `decision === "go"`:

1. Adicionar 6 features ao features.json:
   - `F-XX1`: research (agent=researcher, com descricao completa incluindo reflexao de threshold)
   - `F-XX2`: derive specs (agent=general)
   - `F-XX3`: derive PRPs (agent=general)
   - `F-XX4`: vibe/implementar (agent=coder)
   - `F-XX5`: validate & fix (agent=coder)
   - `F-XX6`: close wave (agent=general)
2. Cada feature com dependencies chain (F-XX2 depende de F-XX1, etc.)
3. Cada descricao segue os templates definidos no EXPERIMENTO.md

O loop.mjs ve pendencias novas no features.json e continua. Zero scripts novos.

---

## Criterio de Parada Global

### PROT011 — Encerramento do Experimento

| Condicao | Acao |
|----------|------|
| Researcher conclui `decision: "stop"` (nenhuma descoberta nova justifica incremento) | Wave encerra com features skipped; loop.mjs exit(0) com sucesso |
| N waves consecutivas sem melhoria mensuravel | General registra falha em progress.txt; loop.mjs exit(0) |
| Falha irrecuperavel em step critico (research ou vibe) | Log detalhado; abort manual necessario |

---

## Rastreabilidade

| ID | Step | Agente | Gate |
|----|------|--------|------|
| PROT001 | Setup do experimento | operador humano | — |
| PROT002 | Research dores/ganhos | researcher | — |
| PROT003 | Reflexao de threshold | researcher | Gate 1 |
| PROT004 | Derivar specs | general | — |
| PROT005 | Derivar PRPs | general | — |
| PROT006 | Vibe (micro harness) | coder | — |
| PROT007 | Validar e corrigir | coder | — |
| PROT008 | Fechar wave | general | — |
| PROT009 | Decisao de continuidade | general | Gate 2 |
| PROT010 | Templateamento proxima wave | general | — |
| PROT011 | Encerramento do experimento | — | Parada global |
