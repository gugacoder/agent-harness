# Loop de desenvolvimento incremental em worktree isolada

Voce e o CODING AGENT — itera todas as features inline, dentro desta conversa, operando numa worktree isolada.

Argumentos: $ARGUMENTS

Formato esperado: `<prp-path>` ou `<slug>`

## Passo 0 — Cascata: garantir worktree + inicializacao

**Deteccao de tipo:**
- Contem `/` ou termina com `.md` → **PRP path** → derive slug do stem do arquivo (sem .md), ou do diretorio pai se for `PRP.md`
- Caso contrario → **slug**

**Verificar worktree:**
- Se `.harness/worktrees/{slug}/` NAO existe → execute a logica do `/kai:vibe:worktree` inline (incluindo frontmatter lifecycle e .env com portas isoladas +100)

**Verificar inicializacao:**
- Se `.harness/runs/{slug}--cc/features.json` NAO existe (no ROOT) → execute a logica do `/kai:vibe:plan` inline

Derive:
- **session**: `{slug}--cc`
- **worktree**: `.harness/worktrees/{slug}/`
- **runs_dir**: `.harness/runs/{session}/` (ROOT — status centralizado)

### GATE CREATE — Verificar ANTES de prosseguir ao Bootstrap

```
[ ] PRP tem frontmatter com `status: current`: leia o inicio do arquivo PRP
[ ] Worktree existe: ls .harness/worktrees/{slug}/CLAUDE.md
[ ] Branch existe: git branch --list harness/{slug}
[ ] .env copiado com portas isoladas (+100): grep FRONTEND_PORT .harness/worktrees/{slug}/.env
[ ] config.json existe no ROOT: ls .harness/runs/{session}/config.json
```

### GATE INITIALIZE — Verificar ANTES de prosseguir ao Bootstrap

```
[ ] features.json existe no ROOT: ls .harness/runs/{session}/features.json
[ ] features.json tem features: wc -l na saida
[ ] progress.txt existe no ROOT: ls .harness/runs/{session}/progress.txt
```

Se QUALQUER gate falha → PARE e corrija antes de continuar.

## Bootstrap

Status no ROOT, codigo na worktree:

1. Leia `.harness/runs/{session}/config.json` — configuracao do run (ROOT)
2. Resolva o agent profile: se `config.agent.profile` existir, leia `.harness/agents/{profile}.md` para absorver o protocolo do agente (`coder`, `researcher`, ou `general`). Se nao existir, leia `.harness/agents/coder.md` (fallback).
3. Leia `.harness/runs/{session}/progress.txt` — estado atual (ROOT)
4. Leia `.harness/runs/{session}/features.json` — feature list completa (ROOT)
5. Se existir `.harness/learnings.md` — leia licoes aprendidas
6. `git -C .harness/worktrees/{slug} log --oneline -10` — mudancas recentes na worktree
7. Se existir `.harness/worktrees/{slug}/.harness/agent-setup.sh` — rode: `cd .harness/worktrees/{slug} && bash .harness/agent-setup.sh`
8. Smoke test da funcionalidade existente

**Nota:** Se uma feature tem campo `agent` diferente do profile da session, o loop inline NAO pode executar essa feature (precisa de um agente diferente com tools diferentes). Marque como `blocked` com nota "requires agent={agent}" e passe para a proxima elegivel.

## Algoritmo do Loop

Repita ate que todas as features estejam "passing" ou "skipped":

### 1. Selecionar proxima feature
- Filtre features com status `pending` ou `failing`
- Dentre essas, filtre as que tem TODAS as dependencies com status `passing`
- Ordene por `priority` (menor = mais prioritario)
- Pegue a primeira — essa e a feature alvo

Se nao houver feature elegivel:
- Se todas sao `passing` → **SPRINT COMPLETA** — reporte "Sprint completa!" e sugira `/kai:vibe:merge {slug}`
- Se ha features `blocked`/`failing` com deps nao satisfeitas → **DEADLOCK** — pare e reporte

### 2. Implementar a feature
- Marque status como `in_progress` em `.harness/runs/{session}/features.json` (ROOT)
- Git commit dentro da worktree: `wip({escopo}): iniciar F-XXX` (cria ponto de transicao rastreavel)
- Se a feature tiver `prp_path`, leia o PRP para contexto
- Consulte `specs` de config.json para referencias tecnicas quando necessario
- Implemente completamente **DENTRO da worktree** (`.harness/worktrees/{slug}/`)
- Rode TODOS os testes definidos na feature
- Se encontrar bugs de features anteriores, CORRIJA PRIMEIRO

### 3. Teste Playwright e2e (se a feature toca interface)

Se a feature implementada envolve UI (paginas, componentes, rotas frontend), **OBRIGATORIO** criar/atualizar um teste Playwright:

1. **Identifique o app afetado** — `cia-app` (`apps/cia-app/e2e/`) ou `agentic-hub` (`apps/agentic-hub/e2e/`)
2. **Crie ou atualize um `.spec.ts`** no diretorio `e2e/` do app, seguindo os padroes existentes:
   - Importe `{ test, expect } from '@playwright/test'`
   - Use `page.goto('/app/{rota}')` para navegar
   - Verifique que a pagina renderiza sem erros de console (`page.on('console', ...)` + `page.on('pageerror', ...)`)
   - Verifique que os elementos essenciais estao visiveis
   - Verifique que interacoes basicas funcionam (clicks, forms, etc.)
3. **Rode o teste** contra a worktree (use a porta isolada do .env):
   ```bash
   cd .harness/worktrees/{slug}/apps/{app}
   PLAYWRIGHT_BASE_URL=http://localhost:{porta_isolada} npx playwright test {spec-file} --reporter=list
   ```
   - `cia-app`: usa `FRONTEND_PORT` do `.env` da worktree
   - `central`: usa `CENTRAL_PORT` do `.env` da worktree
4. **Se o teste falhar**: corrija a implementacao e re-rode antes de prosseguir
5. **Se a feature NAO toca interface** (ex: backend-only, config, schema): pule este passo

O teste Playwright deve cobrir:
- **Zero erros de console** — nenhum erro JS ou HTTP >=400 na pagina
- **Renderizacao basica** — elementos-chave visiveis apos navegacao
- **Interacao funcional** — fluxo principal da feature funciona end-to-end

### 4. Atualizar estado
- Se todos os testes passaram (incluindo Playwright se aplicavel):
  - Atualize `.harness/runs/{session}/features.json` (ROOT): status → `passing`, adicione `completed_at`
  - Atualize `.harness/runs/{session}/progress.txt` (ROOT): registre o que fez na Session Notes
- Se falhou:
  - Atualize `.harness/runs/{session}/features.json` (ROOT): status → `failing`, incremente `retries`
  - Registre o problema em `.harness/runs/{session}/progress.txt` (ROOT)
  - **Tente corrigir e re-testar antes de desistir**

### 5. Commit (dentro da worktree)
```
feat(<escopo>): implementar F-XXX <nome da feature>

- O que foi implementado
- Testes que passaram (incluindo e2e se aplicavel)
- Qualquer decisao arquitetural tomada

Progress: X/N features complete
Next: F-YYY <proxima feature>
```

### 6. Report e continuar
Apos cada feature, reporte brevemente:
- Feature implementada e status
- Confirmar que status transitou corretamente: `in_progress` (commit wip) → `passing` (commit feat)
- Contagem: X/N passing
- Proxima feature na fila
- Entao **continue para a proxima feature** sem esperar confirmacao

## Regras

- IMPLEMENTE features uma a uma, em ordem de prioridade.
- TESTE antes de marcar como passing.
- CORRIJA bugs encontrados antes de avancar.
- COMMIT apos cada feature dentro da worktree (estado limpo para outro agente continuar).
- NAO pare entre features — continue o loop ate completar ou travar.
- Se o usuario intervir com uma mensagem, PARE o loop, atenda, e depois retome.
- Se uma feature falhar 3 vezes consecutivas, marque como `skipped`, registre em progress.txt, e passe para a proxima.
- CODIGO na worktree (`.harness/worktrees/{slug}/`), STATUS no root (`.harness/runs/{session}/`).

## Comece agora

Execute o Passo 0 (cascata), depois o bootstrap, e inicie o loop.
