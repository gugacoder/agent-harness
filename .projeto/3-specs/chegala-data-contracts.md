# Chega.la - Data Contracts

Schemas e lifecycle de todos os artefatos intermediarios trocados entre agentes durante a execucao do macro harness.

---

## Artefatos

### DC001 — config.json

**Criado por:** vibe:plan (PROT001)
**Lido por:** todos os agentes (startup protocol)
**Atualizado por:** nunca (imutavel apos criacao)

**Schema:**

```typescript
import { z } from "zod";

export const AgentConfigSchema = z.object({
  profile: z.enum(["coder", "researcher", "general"]),
});

export const ConfigSchema = z.object({
  session: z.string(),
  worktree: z.string(),
  prp: z.string().optional(),
  agent: AgentConfigSchema,
  specs: z.array(z.string()).optional(),
  runs_dir: z.string(),
});

export type Config = z.infer<typeof ConfigSchema>;
```

**Exemplo:**

```json
{
  "session": "macro-chegala-001",
  "worktree": ".harness/worktrees/macro-chegala-001",
  "agent": {
    "profile": "coder"
  },
  "specs": [".projeto/1-brainstoming/EXPERIMENTO.md"],
  "runs_dir": ".harness/runs/macro-chegala-001"
}
```

---

### DC002 — features.json

**Criado por:** vibe:plan (PROT001) — Wave 1 inicial
**Lido por:** todos os agentes (startup protocol); loop.mjs (controle de fluxo)
**Atualizado por:** general/close-wave (PROT010 — adiciona proxima wave); researcher (PROT003 — marca skipped quando threshold atingido); agentes ao completar features (status → passing)

**Schema:**

```typescript
import { z } from "zod";

export const FeatureStatusSchema = z.enum([
  "failing",
  "passing",
  "skipped",
]);

export const FeatureSchema = z.object({
  id: z.string().regex(/^F-\d{3}$/),
  name: z.string(),
  description: z.string(),
  status: FeatureStatusSchema,
  agent: z.enum(["researcher", "general", "coder"]).optional(),
  dependencies: z.array(z.string()).default([]),
  wave: z.number().int().positive(),
  completed_at: z.string().datetime().optional(),
  skip_reason: z.string().optional(),
  prp_path: z.string().optional(),
});

export const FeaturesFileSchema = z.object({
  features: z.array(FeatureSchema),
});

export type Feature = z.infer<typeof FeatureSchema>;
```

**Exemplo:**

```json
{
  "features": [
    {
      "id": "F-001",
      "name": "research dores/ganhos wave 1",
      "description": "Ler documentos de referencia...",
      "status": "passing",
      "agent": "researcher",
      "dependencies": [],
      "wave": 1,
      "completed_at": "2026-02-28T14:00:00Z"
    },
    {
      "id": "F-002",
      "name": "derivar specs wave 1",
      "description": "Ler brainstorming.md da wave 1...",
      "status": "failing",
      "agent": "general",
      "dependencies": ["F-001"],
      "wave": 1
    }
  ]
}
```

---

### DC003 — ranking.json

**Criado por:** researcher (PROT002 — primeira wave)
**Lido por:** researcher (waves seguintes — estado acumulado); general/close-wave (PROT009 — campo `decision`); general/derive-specs (priorizacao)
**Atualizado por:** researcher (a cada wave — reclassifica scores, adiciona descobertas, atualiza `decision`)

**Schema:**

```typescript
import { z } from "zod";

export const DiscoverySchema = z.object({
  id: z.string().regex(/^D-\d{3}$/),
  type: z.enum(["pain", "gain"]),
  description: z.string(),
  score: z.number().int().min(1).max(10),
  discovered_at: z.number().int().positive(),
  last_reclassified_at: z.number().int().positive(),
  implemented_at: z.number().int().positive().optional(),
});

export const RankingSchema = z.object({
  wave: z.number().int().positive(),
  decision: z.enum(["go", "stop"]),
  discoveries: z.array(DiscoverySchema),
});

export type Ranking = z.infer<typeof RankingSchema>;
export type Discovery = z.infer<typeof DiscoverySchema>;
```

**Exemplo:**

```json
{
  "wave": 2,
  "decision": "go",
  "discoveries": [
    {
      "id": "D-001",
      "type": "pain",
      "description": "Falta de visibilidade do entregador em tempo real",
      "score": 9,
      "discovered_at": 1,
      "last_reclassified_at": 2,
      "implemented_at": 1
    },
    {
      "id": "D-002",
      "type": "gain",
      "description": "Reducao de 80% no tempo de atendimento com formulario vs WhatsApp",
      "score": 8,
      "discovered_at": 1,
      "last_reclassified_at": 2
    },
    {
      "id": "D-003",
      "type": "pain",
      "description": "Dificuldade de escalar atendimento com equipe pequena",
      "score": 7,
      "discovered_at": 2,
      "last_reclassified_at": 2
    }
  ]
}
```

---

### DC004 — progress.txt

**Criado por:** vibe:plan (PROT001)
**Lido por:** todos os agentes (startup protocol — entender estado atual)
**Atualizado por:** todos os agentes (ao final de cada feature — registram o que fizeram e proxima prioridade)

**Schema:** Texto livre, formato append-only.

```
## Wave 1

### F-001: research dores/ganhos — PASSING
- Pesquisou dores de empresarios de entregas rapidas
- 12 descobertas no ranking, 4 com score > 7
- Decision: go
- Proxima: F-002 derive specs

### F-002: derive specs — PASSING
- Specs gerados em wave-1/specs/
- 4 arquivos: protocol, data-contracts, agents, success-criteria
- Proxima: F-003 derive prps
```

---

### DC005 — loop.json

**Criado por:** loop.mjs (automatico)
**Lido por:** operador (monitoramento); vibe:spawn (polling de conclusao)
**Atualizado por:** loop.mjs (automatico — a cada mudanca de estado)

**Schema:**

```typescript
import { z } from "zod";

export const LoopStateSchema = z.object({
  status: z.enum(["running", "between", "exited"]),
  current_feature: z.string().optional(),
  exit_reason: z.string().optional(),
  started_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type LoopState = z.infer<typeof LoopStateSchema>;
```

**Exemplo:**

```json
{
  "status": "running",
  "current_feature": "F-002",
  "started_at": "2026-02-28T10:00:00Z",
  "updated_at": "2026-02-28T14:30:00Z"
}
```

---

### DC006 — wave-N/brainstorming.md

**Criado por:** researcher (PROT002)
**Lido por:** general/derive-specs (PROT004); general/derive-prps (PROT005 — indiretamente via specs)
**Atualizado por:** nunca (imutavel apos criacao; nova wave gera novo arquivo)

**Schema:** Markdown livre com estrutura esperada:

```markdown
# Brainstorming Wave {N}

## Descobertas

### Dores
- {descricao} (score: {N})

### Ganhos
- {descricao} (score: {N})

## Analise de Concorrentes
{conteudo}

## Recomendacoes para Specs
{conteudo}
```

---

### DC007 — wave-N/specs/

**Criado por:** general/derive-specs (PROT004)
**Lido por:** general/derive-prps (PROT005)
**Atualizado por:** nunca (imutavel apos criacao)

**Schema:** Diretorio contendo arquivos .md seguindo os patterns da categoria identificada pelo `derive:specs`. Formato depende da classificacao — para waves internas de produto, seguira patterns de app (Tipo 1-6); para specs do processo, seguira patterns de experiment (Tipo E1-E4).

---

### DC008 — wave-N/prps/

**Criado por:** general/derive-prps (PROT005)
**Lido por:** coder/vibe (PROT006)
**Atualizado por:** nunca (imutavel apos criacao)

**Schema:** Diretorio contendo arquivos `PRP-NNN-{escopo}.md` seguindo o pattern de PRP do projeto. Cada PRP auto-contido e implementavel por um agente coder.

---

## Lifecycle

| ID | Artefato | Criado em | Criado por | Lido por | Atualizado por |
|----|----------|-----------|------------|----------|----------------|
| DC001 | config.json | Init (PROT001) | vibe:plan | Todos (startup) | Nunca |
| DC002 | features.json | Init (PROT001) | vibe:plan | Todos; loop.mjs | general (close-wave); researcher (skip); agentes (status) |
| DC003 | ranking.json | Wave 1 Step 1 (PROT002) | researcher | researcher; general (close-wave, derive-specs) | researcher (a cada wave) |
| DC004 | progress.txt | Init (PROT001) | vibe:plan | Todos (startup) | Todos (append ao final de cada feature) |
| DC005 | loop.json | Inicio do loop | loop.mjs | Operador; vibe:spawn | loop.mjs (automatico) |
| DC006 | brainstorming.md | Wave N Step 1 (PROT002) | researcher | general (derive-specs) | Nunca |
| DC007 | specs/ | Wave N Step 2 (PROT004) | general | general (derive-prps) | Nunca |
| DC008 | prps/ | Wave N Step 3 (PROT005) | general | coder (vibe) | Nunca |

---

## Rastreabilidade

| ID | Artefato | Protocolo (Step) | Agente |
|----|----------|-----------------|--------|
| DC001 | config.json | PROT001 (init) | vibe:plan |
| DC002 | features.json | PROT001 (init), PROT010 (templateamento) | vibe:plan, general |
| DC003 | ranking.json | PROT002 (research), PROT003 (threshold) | researcher |
| DC004 | progress.txt | PROT001-PROT011 (todos) | todos |
| DC005 | loop.json | Loop runtime | loop.mjs |
| DC006 | brainstorming.md | PROT002 (research) | researcher |
| DC007 | specs/ | PROT004 (derive specs) | general |
| DC008 | prps/ | PROT005 (derive prps) | general |
