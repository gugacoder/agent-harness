# Macro Experiment Bootstrap — Inicializacao e templateamento de waves para o macro harness

## Objetivo

Implementar o mecanismo de bootstrap do macro experimento Chega.la: template de wave reutilizavel, script de inicializacao que gera Wave 1 a partir do EXPERIMENTO.md, e funcao de templateamento que o agente close-wave usa para adicionar waves subsequentes ao features.json.

---

## Execution Mode

`implementar`

---

## Contexto

### Estado atual

- O EXPERIMENTO.md define a anatomia completa de uma wave (6 features, templates de descricao, reflexao de threshold)
- O `vibe:plan` e generico — decompose qualquer PRP em features, mas nao conhece a anatomia de wave do macro harness
- O `loop.mjs` ja suporta features.json vivo (recarrega a cada iteracao, respeita dependencias)
- O `run.mjs` ja resolve agentes via fallback chain (`feature.agent` → `config.agent.profile` → `"coder"`)
- Nao existe mecanismo para gerar a Wave 1 nem para templatear waves subsequentes
- O agente close-wave (PROT008/PROT010) precisa adicionar features ao features.json seguindo os templates — hoje nao tem acesso a eles

### Problema / Motivacao

- PROT001 exige features.json com Wave 1 (F-001..F-006) apos inicializacao
- PROT010 exige templateamento de proxima wave pelo close-wave agent
- Sem templates executaveis, o close-wave depende de descrever tudo no prompt da feature (verbose, fragil, propenso a desvio)
- As descricoes de tarefas no EXPERIMENTO.md sao longas e detalhadas (especialmente a reflexao de threshold do researcher) — copiar manualmente e insustentavel
- SC008 exige que todas as features da wave completem em sequencia — templates padronizados garantem consistencia

### O que muda

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Wave 1 | Criada manualmente ou pelo vibe:plan generico | Gerada pelo init-macro.mjs com templates do EXPERIMENTO |
| Waves seguintes | Close-wave agent improvisa descricoes | Close-wave usa `appendWave()` com templates padronizados |
| Descricoes de tarefas | Dependem do prompt do agente | Embarcadas no template, identicas em toda wave |
| Consistencia entre waves | Variavel | Garantida (mesmo template, diferentes IDs e wave number) |

---

## Especificacao

### 1. Template de Wave

#### 1.1 Arquivo: `.harness/templates/wave.mjs`

Modulo ESM que exporta a funcao `buildWaveFeatures(waveNumber, runsDir, startId)`.

Parametros:
- `waveNumber` (int) — numero da wave (1, 2, 3...)
- `runsDir` (string) — path do runs_dir da session (ex: `.harness/runs/macro-chegala-001`)
- `startId` (int) — numero inicial para IDs (1 para Wave 1, 7 para Wave 2, etc.)

Retorno: array de 6 objetos feature no formato do features.json.

Cada feature segue a estrutura:

```javascript
{
  id: `F-${String(startId).padStart(3, '0')}`,
  name: "research dores/ganhos wave {N}",
  description: "...", // template completo do EXPERIMENTO.md
  status: "failing",
  priority: startId,
  agent: "researcher",
  dependencies: [],     // primeira feature da wave nao depende de nada NA wave
  wave: waveNumber,
  tests: ["..."]
}
```

#### 1.2 Descricoes das 6 features (templates)

As descricoes abaixo sao extraidas LITERALMENTE do EXPERIMENTO.md (secao "O Papel do Inicializador"). O template substitui `{N}` pelo numero da wave, `{runs_dir}` pelo path da session, e `{prev_feature}` pelo ID da feature anterior.

**Feature 1 — Research (agent=researcher):**

Descricao: conteudo completo da secao "Tarefa: Research" do EXPERIMENTO.md, incluindo o protocolo de REFLEXAO DE THRESHOLD com as 4 perguntas e a DECISAO (go/stop).

Tests: `["ranking.json existe e parseia sem erros via RankingSchema", "brainstorming.md gerado em {runs_dir}/wave-{N}/", "features.json atualizado (status passing ou features skipped)"]`

**Feature 2 — Derivar Specs (agent=general):**

Descricao: conteudo da secao "Tarefa: Derivar Specs" do EXPERIMENTO.md.

Tests: `["specs/ existe em {runs_dir}/wave-{N}/ com pelo menos 1 arquivo", "specs referenciam ranking.json"]`

**Feature 3 — Derivar PRPs (agent=general):**

Descricao: conteudo da secao "Tarefa: Derivar PRPs" do EXPERIMENTO.md.

Tests: `["prps/ existe em {runs_dir}/wave-{N}/ com pelo menos 1 arquivo PRP", "cada PRP e auto-contido e implementavel"]`

**Feature 4 — Implementar/Vibe (agent=coder):**

Descricao: conteudo da secao "Tarefa: Implementar — Vibe" do EXPERIMENTO.md, incluindo o pipeline de micro harness (worktree → plan → spawn → merge por PRP).

Tests: `["pelo menos 1 PRP implementado e merged", "git log mostra commits de implementacao", "progress.txt atualizado com resultado"]`

**Feature 5 — Validar e Corrigir (agent=coder):**

Descricao: conteudo da secao "Tarefa: Validar e Corrigir" do EXPERIMENTO.md.

Tests: `["testes do projeto passing (ou log explicando falhas irrecuperaveis)", "branding verificado: logo SVG + cores #222e6e/#1dace7/#fca322"]`

**Feature 6 — Fechar Wave (agent=general):**

Descricao: conteudo da secao "Tarefa: Fechar Wave" do EXPERIMENTO.md, incluindo a logica de decisao (go/stop) baseada em ranking.json.

Tests: `["git tag wave-{N} criado", "se decision=go: features.json expandido com wave {N+1}", "se decision=stop: progress.txt registra encerramento", "progress.txt atualizado com resumo da wave"]`

#### 1.3 Dependencias entre features

Dentro da wave, as features formam chain linear:

```
F-XX1 (research)     → sem dependencias internas
F-XX2 (specs)        → depende de F-XX1
F-XX3 (prps)         → depende de F-XX2
F-XX4 (vibe)         → depende de F-XX3
F-XX5 (validate)     → depende de F-XX4
F-XX6 (close)        → depende de F-XX5
```

Se a wave NAO e a primeira (waveNumber > 1), F-XX1 tambem depende da ultima feature da wave anterior (F-(startId-1) formatado como `F-{padStart(3,'0')}`).

#### 1.4 Exportacoes adicionais

Exportar tambem:
- `FEATURES_PER_WAVE = 6` — constante reutilizavel
- `computeStartId(waveNumber)` — retorna `(waveNumber - 1) * 6 + 1`

### 2. Script de Inicializacao

#### 2.1 Arquivo: `.harness/scripts/init-macro.mjs`

Script CLI que inicializa uma session de macro experimento:

```
node .harness/scripts/init-macro.mjs <experimento-path> [session-name]
```

Parametros:
- `experimento-path` — path para o EXPERIMENTO.md (obrigatorio)
- `session-name` — nome da session (opcional; default: `macro-{slug}-001` onde slug e derivado do nome do arquivo)

Comportamento:

1. Validar que `experimento-path` existe e e um arquivo .md
2. Derivar `session` e `runs_dir` (`.harness/runs/{session}/`)
3. Criar diretorio `runs_dir` se nao existir
4. Gerar `config.json` em `runs_dir`:

```json
{
  "session": "{session}",
  "worktree": ".harness/worktrees/{session}",
  "agent": { "profile": "researcher" },
  "specs": ["{experimento-path}"],
  "runs_dir": ".harness/runs/{session}",
  "prp_path": "{experimento-path}"
}
```

O `agent.profile` inicial e `"researcher"` porque a Wave 1 comeca com research. O `run.mjs` usa `feature.agent` como override (prioridade 1 na fallback chain), entao o profile da session e secundario.

5. Gerar `features.json` em `runs_dir` usando `buildWaveFeatures(1, runsDir, 1)`
6. Gerar `progress.txt` em `runs_dir`:

```
# Macro Experiment: Chega.la
## Status: Inicializado
## Session: {session}
## Experimento: {experimento-path}
## Inicio: {ISO timestamp}

### Wave 1
Features: F-001..F-006 (research → specs → prps → vibe → validate → close)
Agentes: researcher, general, general, coder, coder, general
```

7. Imprimir resumo e instrucoes:

```
Session: {session}
Runs dir: {runs_dir}
Features: 6 (Wave 1)
Proximo passo: node .harness/scripts/loop.mjs {session}
```

#### 2.2 Exportacoes

Exportar `initMacroExperiment(experimentoPath, sessionName?)` para uso programatico.

### 3. Funcao de Templateamento (para close-wave)

#### 3.1 Arquivo: `.harness/templates/wave.mjs` (mesmo arquivo da secao 1)

Exportar funcao adicional `appendWave(featuresPath, waveNumber, runsDir)`:

1. Ler features.json existente
2. Calcular `startId` via `computeStartId(waveNumber)`
3. Gerar 6 features via `buildWaveFeatures(waveNumber, runsDir, startId)`
4. Adicionar ao array existente
5. Salvar features.json

Esta funcao e chamada pelo agente close-wave (PROT010) quando `ranking.json.decision === "go"`. O agente pode executar:

```bash
node -e "import {appendWave} from './.harness/templates/wave.mjs'; await appendWave('{featuresPath}', {N+1}, '{runsDir}')"
```

Ou importar diretamente se executar via script.

### 4. Testes

#### 4.1 Arquivo: `.harness/templates/wave.test.mjs`

Testes usando `node:test`:

- `buildWaveFeatures(1, '/tmp/test', 1)` retorna array de 6 features
- Cada feature tem id, name, description, status, priority, agent, dependencies, wave, tests
- IDs sequenciais: F-001..F-006
- Agents corretos: researcher, general, general, coder, coder, general
- Dependencies chain: F-002 depende de F-001, F-003 de F-002, etc.
- F-001 da Wave 1 nao tem dependencias
- `buildWaveFeatures(2, '/tmp/test', 7)` gera F-007..F-012
- F-007 (Wave 2) depende de F-006 (Wave 1)
- `computeStartId(1)` retorna 1, `computeStartId(3)` retorna 13
- `appendWave` adiciona 6 features a um array existente sem sobrescrever
- Cada descricao de feature contem palavras-chave do template (ex: feature research contem "REFLEXAO DE THRESHOLD")

---

## Limites

### NAO fazer

- NAO modificar `loop.mjs`, `run.mjs`, ou qualquer script existente em `.harness/scripts/`
- NAO modificar os agentes em `.harness/agents/` (researcher.md, general.md, coder.md)
- NAO modificar o EXPERIMENTO.md — os templates sao extraidos dele e hardcoded no wave.mjs
- NAO criar o `vibe:plan` especifico para macro — o init-macro.mjs substitui a necessidade
- NAO gerar artefatos de wave (brainstorming.md, specs/, prps/) — isso e responsabilidade dos agentes em runtime

### Observacoes

- O `loop.mjs` ja trata features.json como array puro (via `loadFeatures` que aceita array ou `{features: [...]}`). O `saveFeatures` salva como array puro. Manter esse formato.
- O `selectNextFeature` ordena por priority e verifica dependencias contra passingIds. As features geradas pelo template devem ter `priority` igual ao ID numerico para garantir ordem.
- O features.json gerado pelo init-macro.mjs e identico ao que o `vibe:plan` geraria — o loop.mjs consome sem distincao.
- O init-macro.mjs NAO cria worktree — isso e responsabilidade do operador via `vibe:worktree`. O init-macro.mjs so gera os artefatos de status no ROOT.
- Os status iniciais sao `"failing"` (nao `"pending"`) porque o `selectNextFeature` filtra por `pending` ou `failing` — ambos funcionam, mas `failing` e o padrao do vibe:plan existente.
- O close-wave agent pode chamar `appendWave()` via `node -e` ou importando diretamente. A funcao e idempotente (nao gera duplicatas se chamada multiplas vezes com o mesmo waveNumber — deve verificar se ja existem features com aquele wave number).

---

## Ordem de Execucao

| Fase | O que | Depende de |
|------|-------|------------|
| 1 | Implementar `wave.mjs` (buildWaveFeatures + computeStartId + FEATURES_PER_WAVE) | PRP-001 (schemas Zod para validar formato, se disponivel — nao bloqueia) |
| 2 | Adicionar `appendWave()` ao wave.mjs | Fase 1 |
| 3 | Implementar `init-macro.mjs` (CLI + funcao exportada) | Fase 1 |
| 4 | Implementar `wave.test.mjs` e rodar testes | Fases 1-3 |

Fases 1-2 sao o mesmo arquivo. Fase 3 depende de Fase 1 (importa buildWaveFeatures). Fase 4 testa tudo.
