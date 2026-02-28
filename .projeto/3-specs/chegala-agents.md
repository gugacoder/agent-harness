# Chega.la - Agent Specifications

Especificacao dos 3 agentes autonomos e 2 componentes de orquestracao que operam o macro harness.

---

## Diagrama de Handoff

```
                    ┌─────────────┐
                    │  Operador   │
                    │  (humano)   │
                    └──────┬──────┘
                           │ vibe:worktree + vibe:plan
                           ▼
                    ┌─────────────┐
                    │  vibe:plan  │──── gera features.json Wave 1
                    │  (AGT004)   │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  loop.mjs   │──── controla fluxo
                    │  (AGT005)   │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ researcher  │ │   general   │ │   coder     │
    │  (AGT001)   │ │  (AGT002)   │ │  (AGT003)   │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           │  ranking.json │  specs/       │  codigo
           │  brainstorm   │  prps/        │  testes
           │  decision     │  features.json│  merge
           │               │  (close-wave) │
           ▼               ▼               ▼
    ┌─────────────────────────────────────────────┐
    │              features.json (vivo)            │
    │         + ranking.json + progress.txt        │
    └─────────────────────────────────────────────┘

Fluxo por wave:
  researcher → general (specs) → general (prps) → coder (vibe)
  → coder (validate) → general (close-wave) → [proxima wave | FIM]
```

---

## Agentes

### AGT001 — researcher

**Ordem de execucao:** 1 (por wave)
**Tipo:** avaliador
**Arquivo:** `.harness/agents/researcher.md`

| Param | Valor |
|-------|-------|
| Tools | WebSearch, WebFetch, Read, Write, Bash, Glob, Grep |
| Max turns | 100 |
| Rollback | none |
| Timeout | N/A (controlado por max_turns) |

**Inputs:**
- `config.json` — configuracao da session (DC001)
- `ranking.json` — ranking acumulado de waves anteriores, se existir (DC003)
- Documentos de referencia do produto (listados no EXPERIMENTO.md)
- `features.json` — para identificar feature atual (DC002)
- `progress.txt` — estado atual do experimento (DC004)

**Outputs:**
- `wave-N/brainstorming.md` — brainstorming da wave (DC006)
- `ranking.json` — atualizado com novas descobertas e reclassificacoes (DC003)
- `features.json` — atualizado com status da feature (passing) e possivelmente features skipped (DC002)

**Autoridade de decisao:**
- Pode: adicionar descobertas ao ranking, reclassificar scores de descobertas existentes, decidir `decision: "go"` ou `"stop"`, marcar features F-XX2..F-XX6 como `skipped` quando threshold atingido
- Nao pode: modificar config.json, alterar descricao de features, criar PRPs ou specs, modificar codigo

**Limites:**
- Score deve ser inteiro 1-10
- Reflexao de threshold obrigatoria a cada wave (pode concluir "cedo demais para avaliar" nas primeiras)
- Deve acumular (nao sobrescrever) ranking.json — reclassificar existentes + adicionar novos

---

### AGT002 — general

**Ordem de execucao:** 2, 3 e 6 (por wave — derive specs, derive prps, close wave)
**Tipo:** executor
**Arquivo:** `.harness/agents/general.md`

| Param | Valor |
|-------|-------|
| Tools | Edit, Write, Bash, Read, Glob, Grep |
| Max turns | 150 |
| Rollback | none |
| Timeout | N/A (controlado por max_turns) |

**Inputs (variam por tarefa):**

| Tarefa | Inputs |
|--------|--------|
| Derive specs (PROT004) | `wave-N/brainstorming.md` (DC006); `ranking.json` (DC003) |
| Derive PRPs (PROT005) | `wave-N/specs/` (DC007) |
| Close wave (PROT008) | `ranking.json` (DC003); `features.json` (DC002) |

**Outputs (variam por tarefa):**

| Tarefa | Outputs |
|--------|---------|
| Derive specs | `wave-N/specs/` (DC007) |
| Derive PRPs | `wave-N/prps/` (DC008) |
| Close wave | Git tag `wave-N`; features.json atualizado com Wave N+1 (DC002) |

**Autoridade de decisao:**
- Pode: usar skills existentes (derive:specs, derive:prps), criar artefatos em wave-N/, adicionar features ao features.json (close-wave), criar git tags
- Nao pode: modificar ranking.json, decidir threshold, modificar codigo fonte do app, alterar config.json

**Limites:**
- Deve usar skills do projeto (derive:specs, derive:prps) quando disponiveis — nao reinventar
- Close-wave deve respeitar `ranking.json.decision` — se `"stop"`, nao templatear proxima wave
- Descricoes de features templateadas devem seguir os templates completos do EXPERIMENTO.md

---

### AGT003 — coder

**Ordem de execucao:** 4 e 5 (por wave — vibe/implementar e validate/fix)
**Tipo:** executor
**Arquivo:** `.harness/agents/coder.md`

| Param | Valor |
|-------|-------|
| Tools | Edit, Write, Bash, Read, Glob, Grep |
| Max turns | 200 |
| Rollback | stash (git stash em caso de falha irrecuperavel) |
| Timeout | N/A (controlado por max_turns) |

**Inputs (variam por tarefa):**

| Tarefa | Inputs |
|--------|--------|
| Vibe/implementar (PROT006) | `wave-N/prps/` (DC008); config.json (DC001) |
| Validate & fix (PROT007) | Codigo implementado; specs de referencia |

**Outputs:**

| Tarefa | Outputs |
|--------|---------|
| Vibe/implementar | Codigo implementado e comitado; worktrees de nivel 2 merged |
| Validate & fix | Testes passing; branding verificado; bugs corrigidos |

**Autoridade de decisao:**
- Pode: implementar codigo, criar/modificar arquivos do app, rodar testes, corrigir bugs, criar worktrees de nivel 2, fazer merge
- Nao pode: modificar ranking.json, alterar features.json (exceto status da feature atual), modificar brainstorming ou specs, decidir threshold

**Limites:**
- Processar PRPs sequencialmente (merge de um antes de iniciar o proximo)
- Se PRP falhar (deadlock/conflito): log em progress.txt, continuar com demais
- Branding Chega.la obrigatorio: logo SVG (nunca texto generico), cores Primary #222e6e, Secondary #1dace7, Accent #fca322
- Commit com estado limpo ao final de cada feature

---

### AGT004 — vibe:plan (orquestrador)

**Ordem de execucao:** 0 (inicializacao unica)
**Tipo:** orquestrador
**Arquivo:** `.claude/commands/vibe/plan.md`

| Param | Valor |
|-------|-------|
| Tools | Todos (command mode) |
| Max turns | N/A (execucao unica) |
| Rollback | N/A |
| Timeout | N/A |

**Inputs:**
- EXPERIMENTO.md ou PRP fonte
- Estado do repositorio

**Outputs:**
- `config.json` (DC001)
- `features.json` com Wave 1 (DC002)
- `progress.txt` inicializado (DC004)

**Autoridade de decisao:**
- Pode: criar toda a estrutura inicial, decompor EXPERIMENTO em features, selecionar agent profiles por feature
- Nao pode: executar features (delega para loop.mjs + agentes)

---

### AGT005 — loop.mjs (controlador de loop)

**Ordem de execucao:** Continuo (de init ate encerramento)
**Tipo:** orquestrador
**Arquivo:** `.harness/scripts/loop.mjs`

| Param | Valor |
|-------|-------|
| Tools | Bash (spawn de processos Claude) |
| Max turns | N/A (processo externo) |
| Rollback | N/A |
| Timeout | N/A (roda ate exit) |

**Inputs:**
- `features.json` (DC002) — lista de features e status
- `config.json` (DC001) — session config
- `.harness/agents/{profile}.md` — definicao de agentes

**Outputs:**
- `loop.json` (DC005) — estado do loop
- Processos Claude spawnados por feature

**Autoridade de decisao:**
- Pode: selecionar proxima feature (maior prioridade, status failing, dependencias passing), spawnar processos Claude, atualizar loop.json
- Nao pode: modificar features.json, alterar conteudo de features, decidir threshold

**Logica de resolucao de agente:**
1. `feature.agent` → override por feature individual
2. `config.agent.profile` → profile da session
3. `"coder"` → fallback default

Resolve para `.harness/agents/{profile}.md`, parseia frontmatter YAML, usa body como prompt.

---

## Matriz de Autoridade

| Acao | researcher (AGT001) | general (AGT002) | coder (AGT003) | vibe:plan (AGT004) | loop.mjs (AGT005) |
|------|---------------------|-------------------|-----------------|--------------------|--------------------|
| Criar ranking.json | ✅ | ❌ | ❌ | ❌ | ❌ |
| Atualizar ranking.json | ✅ | ❌ | ❌ | ❌ | ❌ |
| Decidir go/stop | ✅ | ❌ | ❌ | ❌ | ❌ |
| Skipar features da wave | ✅ | ❌ | ❌ | ❌ | ❌ |
| Criar specs | ❌ | ✅ | ❌ | ❌ | ❌ |
| Criar PRPs | ❌ | ✅ | ❌ | ❌ | ❌ |
| Templatear proxima wave | ❌ | ✅ | ❌ | ❌ | ❌ |
| Criar git tag | ❌ | ✅ | ❌ | ❌ | ❌ |
| Implementar codigo | ❌ | ❌ | ✅ | ❌ | ❌ |
| Criar worktree nivel 2 | ❌ | ❌ | ✅ | ❌ | ❌ |
| Rodar/corrigir testes | ❌ | ❌ | ✅ | ❌ | ❌ |
| Criar config.json | ❌ | ❌ | ❌ | ✅ | ❌ |
| Criar features.json inicial | ❌ | ❌ | ❌ | ✅ | ❌ |
| Spawnar processos Claude | ❌ | ❌ | ❌ | ❌ | ✅ |
| Selecionar proxima feature | ❌ | ❌ | ❌ | ❌ | ✅ |
| Modificar artefato alheio | ❌ | ❌ | ❌ | ❌ | ❌ |
| Atualizar progress.txt | ✅ | ✅ | ✅ | ✅ | ❌ |
| Atualizar feature status | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## Rastreabilidade

| ID | Agente | Steps (PROT) | Artefatos (DC) |
|----|--------|-------------|----------------|
| AGT001 | researcher | PROT002, PROT003 | DC003 (ranking), DC006 (brainstorming) |
| AGT002 | general | PROT004, PROT005, PROT008, PROT009, PROT010 | DC007 (specs), DC008 (prps), DC002 (features — close-wave) |
| AGT003 | coder | PROT006, PROT007 | Codigo fonte, testes |
| AGT004 | vibe:plan | PROT001 | DC001 (config), DC002 (features inicial), DC004 (progress) |
| AGT005 | loop.mjs | Runtime (todos os steps) | DC005 (loop.json) |
