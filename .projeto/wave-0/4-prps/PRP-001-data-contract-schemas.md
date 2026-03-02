---
status: finished
finished_at: 2026-02-28T19:41:02Z
---

# Data Contract Schemas — Schemas Zod executaveis para artefatos do macro harness

## Objetivo

Implementar os schemas Zod definidos em `chegala-data-contracts.md` (DC001-DC008) como codigo TypeScript executavel, com utilitario de validacao para que agentes e scripts possam validar artefatos em runtime.

---

## Execution Mode

`implementar`

---

## Contexto

### Estado atual

- Os schemas existem apenas como documentacao em `.projeto/3-specs/chegala-data-contracts.md`
- O `loop.mjs` le `features.json` e `config.json` via `JSON.parse` sem validacao de schema
- O `run.mjs` parseia frontmatter YAML dos agents mas nao valida config
- Nenhum arquivo `.ts` existe em `.harness/`
- O projeto usa Node.js (ESM — `.mjs` em `.harness/scripts/`)

### Problema / Motivacao

- SC011 exige "ranking.json parseia sem erros via RankingSchema"
- SC012 exige validacao de acumulacao (discoveries.length >= anterior)
- Sem schemas executaveis, a validacao depende de inspecao manual
- Agentes podem produzir JSON malformado que quebra steps subsequentes

### O que muda

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Schemas | Documentacao em markdown | Codigo TypeScript/Zod importavel |
| Validacao | Nenhuma (JSON.parse cru) | Validacao Zod com mensagens de erro claras |
| Deteccao de erros | Falha silenciosa ou crash em step posterior | Falha imediata com diagnostico no step que gerou o artefato |

---

## Especificacao

### 1. Dependencia: Zod

#### 1.1 Instalar Zod no root

```bash
npm install zod
```

Se o projeto nao tiver `package.json` no root, criar um minimo:

```json
{
  "name": "agent-harness",
  "private": true,
  "type": "module",
  "dependencies": {
    "zod": "^3.23"
  }
}
```

### 2. Schemas

#### 2.1 Arquivo: `.harness/schemas/config.schema.mjs`

Schema para DC001 — `config.json`. Exportar `ConfigSchema` e `AgentConfigSchema`.

Campos obrigatorios: `session` (string), `worktree` (string), `agent` (object com `profile` enum), `runs_dir` (string).
Campos opcionais: `prp` (string), `specs` (string ou array de strings), `slug`, `project`, `session_name`, `prp_path`, `parent_workspace`, `parent_branch`, `branch`, `created_at`, `notifications`.

Manter compatibilidade com o formato existente de config.json do `vibe:worktree` (que tem campos adicionais como `slug`, `project`, `parent_workspace`). Usar `.passthrough()` para nao rejeitar campos extras.

#### 2.2 Arquivo: `.harness/schemas/features.schema.mjs`

Schema para DC002 — `features.json`. Exportar `FeatureSchema`, `FeatureStatusSchema`, `FeaturesFileSchema`.

Status possiveis: `"failing"`, `"passing"`, `"skipped"`, `"pending"`, `"in_progress"`, `"blocked"`.

O features.json pode ser um array direto OU um object com chave `features` (ambos formatos existem — o `loop.mjs` ja trata ambos na funcao `loadFeatures`). O schema deve aceitar ambos.

ID: regex `F-\d{3}` (F-001 a F-999).

#### 2.3 Arquivo: `.harness/schemas/ranking.schema.mjs`

Schema para DC003 — `ranking.json`. Exportar `RankingSchema`, `DiscoverySchema`.

Discovery: `id` (regex `D-\d{3}`), `type` (enum: pain/gain), `description`, `score` (int 1-10), `discovered_at` (int positivo), `last_reclassified_at` (int positivo), `implemented_at` (int positivo, opcional).

Ranking: `wave` (int positivo), `decision` (enum: go/stop), `discoveries` (array).

#### 2.4 Arquivo: `.harness/schemas/loop-state.schema.mjs`

Schema para DC005 — `loop.json`. Exportar `LoopStateSchema`.

Status: `"starting"`, `"running"`, `"between"`, `"exited"`. Campos: `pid`, `iteration`, `total`, `done`, `remaining`, `feature_id`, `features_done`, `started_at`, `updated_at`, `exit_reason`, `max_iterations`, `max_features`.

### 3. Utilitario de validacao

#### 3.1 Arquivo: `.harness/schemas/validate.mjs`

Script CLI que valida um artefato contra seu schema.

```
node .harness/schemas/validate.mjs <tipo> <arquivo>
```

Tipos suportados: `config`, `features`, `ranking`, `loop-state`.

Comportamento:
- Le o arquivo JSON
- Parseia com o schema correspondente
- Se valido: imprime "OK: {arquivo} valido" e exit(0)
- Se invalido: imprime erros Zod formatados e exit(1)

Exportar tambem uma funcao `validateArtifact(type, filePath)` para uso programatico por outros scripts.

### 4. Testes

#### 4.1 Arquivo: `.harness/schemas/validate.test.mjs`

Testes basicos usando `node:test` (built-in, sem dependencias):

- Validar config.json valido (sem erros)
- Validar features.json valido em ambos formatos (array e object)
- Validar ranking.json valido
- Rejeitar ranking.json com score fora de 1-10
- Rejeitar features.json com status invalido
- Rejeitar config.json sem campo `session`

---

## Limites

### NAO fazer

- NAO modificar `loop.mjs` ou `run.mjs` — os schemas sao consumidos sob demanda, nao integrados ao loop
- NAO usar TypeScript compiler (tsc) — manter como `.mjs` puro com JSDoc types para compatibilidade com o ecossistema ESM existente
- NAO adicionar frameworks de teste (jest, vitest) — usar `node:test` built-in
- NAO criar schemas para DC006 (brainstorming.md), DC007 (specs/), DC008 (prps/) — sao markdown/diretorios, nao JSON

### Observacoes

- Zod funciona perfeitamente em ESM puro (import { z } from "zod")
- Os schemas devem ser tolerantes com campos extras (`.passthrough()`) para nao quebrar com evolucoes futuras
- O utilitario de validacao sera usado por agentes via Bash: `node .harness/schemas/validate.mjs ranking .harness/runs/{session}/ranking.json`

---

## Ordem de Execucao

| Fase | O que | Depende de |
|------|-------|------------|
| 1 | Instalar Zod (package.json + npm install) | Nada |
| 2 | Implementar os 4 schemas (.mjs) | Fase 1 |
| 3 | Implementar validate.mjs (CLI + funcao) | Fase 2 |
| 4 | Implementar validate.test.mjs e rodar testes | Fase 3 |

Fases 2-4 sao sequenciais. Fase 1 e pre-requisito de todas.
