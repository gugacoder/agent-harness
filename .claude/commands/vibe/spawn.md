# Spawna loop.mjs para desenvolvimento incremental em worktree isolada

Voce e o SPAWN AGENT — prepara a worktree e delega o loop de features ao `loop.mjs`, que spawna instancias de Claude Code para cada feature.

Argumentos: $ARGUMENTS

Formato esperado: `<prp-path>` ou `<slug>`

## Passo 0 — Cascata: garantir worktree + inicializacao

**Deteccao de tipo:**
- Contem `/` ou termina com `.md` → **PRP path** → derive slug do stem do arquivo (sem .md), ou do diretorio pai se for `PRP.md`
- Caso contrario → **slug**

**Verificar worktree:**
- Se `.harness/worktrees/{slug}/` NAO existe → execute a logica do `/kai:vibe:worktree` inline (incluindo frontmatter lifecycle)

**Verificar inicializacao:**
- Se `.harness/runs/{slug}--cc/features.json` NAO existe (no ROOT) → execute a logica do `/kai:vibe:plan` inline

Derive:
- **session**: `{slug}--cc`
- **worktree**: `.harness/worktrees/{slug}/`
- **runs_dir**: `.harness/runs/{session}/` (ROOT)

### GATE CREATE — Verificar ANTES de prosseguir

```
[ ] PRP tem frontmatter com `status: current`: leia o inicio do arquivo PRP
[ ] Worktree existe: ls .harness/worktrees/{slug}/CLAUDE.md
[ ] Branch existe: git branch --list harness/{slug}
[ ] config.json existe no ROOT: ls .harness/runs/{session}/config.json
```

### GATE INITIALIZE — Verificar ANTES de prosseguir

```
[ ] features.json existe no ROOT: ls .harness/runs/{session}/features.json
[ ] features.json tem features: wc -l na saida
[ ] progress.txt existe no ROOT: ls .harness/runs/{session}/progress.txt
[ ] loop.mjs existe: ls .harness/scripts/loop.mjs
[ ] run.mjs existe: ls .harness/scripts/run.mjs
[ ] Agent profile resolvido: config.json tem agent.profile (coder|researcher|general) OU .harness/agents/coder.md existe (fallback)
```

Se QUALQUER gate falha → PARE e corrija antes de continuar.

## Passo 1 — Detectar re-entry

Verifique `.harness/runs/{session}/loop.json` (no ROOT):

- **Se NAO existe** → primeira execucao, continue para o Passo 2
- **Se existe e `status === "running"`** → reporte o PID e pergunte ao usuario se quer parar o loop existente (`touch .harness/runs/{session}/.stop`) ou aguardar
- **Se existe e `exit_reason === "completed"`** → todas as features implementadas. Reporte "Sprint completa!" e sugira `/kai:vibe:merge {slug}`
- **Se existe e `exit_reason` != "completed"** → reporte o estado (exit_reason, ultimo feature_id, iteracao) e pergunte ao usuario se quer retomar ou comecar de novo

## Passo 2 — Spawnar loop.mjs

Execute em background **a partir do ROOT** (loop.mjs le o worktree path do config.json):

```bash
node .harness/scripts/loop.mjs {session}
```

Env overrides opcionais (passe se o usuario solicitar):
- `MAX_TURNS` — max turns por agente spawned
- `MAX_ITERATIONS` — max iteracoes do loop
- `MAX_FEATURES` — max features a implementar
- `MODEL` — modelo do agente
- `SLEEP_BETWEEN` — segundos entre iteracoes (default: 5)

Graceful stop: `touch .harness/runs/{session}/.stop`

## Passo 3 — Monitorar e reportar

Apos spawnar, monitore periodicamente (todos os status no ROOT):

1. Leia `.harness/runs/{session}/loop.json` — status do loop (running/between/exited)
2. Leia `.harness/runs/{session}/progress.txt` — progresso detalhado
3. Leia `.harness/runs/{session}/features.json` — estado das features

Reporte ao usuario:
- Feature atual sendo implementada
- Contagem: X/N passing
- Se houve falhas ou skips
- Quando o loop terminar (exit_reason)

## Regras

- TODO o setup acontece pelo Claude Code (voce).
- A IMPLEMENTACAO das features e delegada ao loop.mjs → run.mjs → instancias de Claude Code spawned.
- O run.mjs resolve o agent profile de `config.agent.profile` → `.harness/agents/{profile}.md` (profiles: `coder`, `researcher`, `general`). O frontmatter YAML do agent define allowedTools, max_turns, rollback. O body e usado como prompt. Se nao houver profile, usa `.harness/agents/coder.md` (fallback).
- Se uma feature tem campo `agent` especifico, o run.mjs usa esse profile para aquela feature (override do profile da session).
- NAO implemente features diretamente — apenas prepare, spawne e monitore.
- O CODIGO e implementado DENTRO da worktree (`.harness/worktrees/{slug}/`).
- O STATUS e gerido no ROOT (`.harness/runs/{session}/`).
- Quando o loop completa (`exit_reason === "completed"`), sugira `/kai:vibe:merge {slug}` para finalizar.

## Comece agora

Execute o Passo 0 (cascata), depois re-entry detection, e spawne o loop.
