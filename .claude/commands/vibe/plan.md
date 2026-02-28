# Inicializa o agent harness numa worktree isolada

Voce e o INITIALIZER AGENT para um projeto long-running com agent harness em worktree isolada.

Argumentos: $ARGUMENTS

Formato esperado: `<prp-path>` ou `<slug>`

## Passo 0 — Resolver argumento e garantir worktree

**Deteccao de tipo:**
- Contem `/` ou termina com `.md` → **PRP path**
- Caso contrario → **slug**

**Se PRP path:**
- Derive o slug do stem do arquivo (sem .md), ou do diretorio pai se for `PRP.md`
- Verifique se a worktree `.harness/worktrees/{slug}/` existe
- Se NAO existe → execute a logica do `/kai:vibe:worktree` inline (parse, validar PRP, frontmatter lifecycle, criar worktree, copiar .env com portas isoladas +100, criar config.json no root)

**Se slug:**
- Verifique se a worktree `.harness/worktrees/{slug}/` existe
- Se NAO existe → procure o PRP com glob `.projeto/PRPs/**/{slug}.md` ou `.projeto/PRPs/**/{slug}/PRP.md` e execute create inline (incluindo .env com portas +100)
- Se existe → continue

Derive:
- **session**: `{slug}--cc`
- **worktree**: `.harness/worktrees/{slug}/`
- **runs_dir**: `.harness/runs/{session}/` (ROOT — gestao centralizada de status)

## Passo 1 — Absorver Contexto

Leia TODOS estes arquivos antes de qualquer acao.

### Identifique a sessao e configuracao (no ROOT):
```
.harness/runs/{session}/config.json
```

### Especificacao (use o `specs` e/ou `prp_path` de config.json):
- Leia o PRP
- Se `specs` aponta para um diretorio, leia TODOS os arquivos de specs (SQL, diagramas, refs, etc.)

### Estrutura existente do projeto (tudo DENTRO da worktree):
- `.harness/worktrees/{slug}/CLAUDE.md` (se existir)
- `.harness/worktrees/{slug}/README.md` (se existir)
- `.harness/worktrees/{slug}/package.json` (se existir)
- Explore a estrutura de diretorios do projeto dentro da worktree
- Se `.harness/runs/{session}/features.json` ja existir (no ROOT), leia-o — esta pode ser uma onda adicional

## Passo 2 — Criar/Atualizar Harness

**CRITICO:** Os artefatos de status ficam em `.harness/runs/{session}/` (no ROOT), NAO dentro da worktree. O `agent-setup.sh` fica em `.harness/agent-setup.sh` dentro da worktree.

### 2.1 `.harness/runs/{session}/features.json` (ROOT)
Analise as specs e PRPs e decomponha a onda em features atomicas e ordenadas.
**Se features.json ja existir, ADICIONE as novas features ao final — nunca apague features existentes.**
Cada feature deve ter:
- id (F-001, F-002... ou continuando a numeracao existente)
- name (nome curto)
- description (o que implementar)
- status: "failing" (TODAS as novas comecam como failing)
- priority (ordem de implementacao, respeitando dependencias)
- tests (lista de criterios verificaveis para marcar como "passing")
- dependencies (lista de ids de features que precisam estar prontas antes)
- prp_path (caminho absoluto para o PRP correspondente, se houver)
- agent (opcional — profile do agente que deve executar esta feature, ex: "coder", "researcher". Se omitido, usa o profile da session)

Organize as novas features na ordem logica de implementacao. A ordem depende da natureza do PRP — adapte conforme o contexto.

### 2.1b Selecionar Agent Profile

Analise a natureza do PRP e selecione o agent profile adequado para o run-loop. Os agents disponíveis ficam em `.harness/agents/`. Cada agent é um markdown com frontmatter YAML (allowedTools, max_turns, rollback) e body (prompt).

- PRP de implementação de código → `coder` (código, testes, arquitetura)
- PRP de pesquisa de mercado/cliente → `researcher` (dores, ganhos, concorrentes, brainstorming)
- Tudo mais (specs, PRPs, wave close, documentação) → `general` (usa skills existentes do projeto)

Se o profile adequado não existir em `.harness/agents/`, use `coder` como fallback.

Atualize `config.json` no ROOT com o profile selecionado:
```bash
# Edite .harness/runs/{session}/config.json → agent.profile = "{profile}"
```

### 2.2 `.harness/runs/{session}/progress.txt` (ROOT)
Crie (ou atualize) o arquivo de progresso com:
- Current Status (estado geral do projeto)
- PRP Path (caminho para o PRP — extraido de config.json)
- Specs Path (caminho para docs — extraido de config.json)
- Worktree Path
- Parent Workspace
- Parent Branch
- Environment (stack, comandos de dev/test/build)
- Lista completa de features (todas as novas como [ ] pendentes)
- Architecture Decisions (extraidas das specs)
- Session Notes: "Session 1 (Initializer): Harness criado para {slug} em worktree isolada"

### 2.3 `.harness/worktrees/{slug}/.harness/agent-setup.sh` (DENTRO da worktree)
Script de bootstrap que:
- Detecta o gerenciador de pacotes (npm, pnpm, yarn, bun) e instala dependencias
- Sobe o ambiente Docker se houver docker-compose
- Inicia dev server
- Faz smoke test basico (curl ou health check)
- Imprime resumo do estado

## Passo 3 — Git Commit na Worktree

Faca um commit **dentro da worktree** (agent-setup.sh e tracked via excecao no gitignore; demais harness files sao gitignored):

```bash
cd .harness/worktrees/{slug}
git add .harness/agent-setup.sh
git commit -m "chore(harness): inicializar agent harness para {slug}"
```

## Passo 4 — Relatorio

Ao final, apresente:
1. Quantas features foram identificadas (e total acumulado se for onda adicional)
2. Qual e a primeira feature a ser implementada
3. Estimativa de complexidade geral
4. Qualquer risco ou ambiguidade encontrada nas specs
5. Worktree path: `.harness/worktrees/{slug}/`
6. Runs dir (status): `.harness/runs/{session}/`
7. Branch: `harness/{slug}`
8. Proximo passo: `/kai:vibe:run {slug}` ou `/kai:vibe:spawn {slug}`

## GATE — Checklist de verificacao (OBRIGATORIO antes de reportar sucesso)

Antes de reportar que a inicializacao foi concluida, verifique CADA item abaixo.
Se QUALQUER item falhar, PARE e corrija antes de prosseguir.

```
[ ] features.json existe no ROOT e tem pelo menos 1 feature
    → Verificar: ls .harness/runs/{session}/features.json
[ ] Todas as features novas tem status "failing" (ou "pending")
    → Verificar: grep -c '"status"' e confirmar nenhum "passing" novo
[ ] Cada feature tem: id, name, description, status, priority, tests[], dependencies[]
    → Verificar: leitura do JSON
[ ] progress.txt existe no ROOT com Session Notes
    → Verificar: ls .harness/runs/{session}/progress.txt
[ ] config.json existe no ROOT e tem prp_path e/ou specs path valido
    → Verificar: grep prp_path .harness/runs/{session}/config.json
[ ] PRP tem frontmatter com `status: current`
    → Verificar: leia o inicio do arquivo PRP e confirme o frontmatter
[ ] Commit de inicializacao feito na worktree
    → Verificar: git -C .harness/worktrees/{slug} log --oneline -1
```

Se todos passam → reporte sucesso e proximo passo.
Se algum falha → corrija e re-verifique.

## Regras

- NAO implemente nenhuma feature. Apenas PLANEJE e ESTRUTURE.
- NAO modifique codigo existente do projeto (src/, apps/, packages/, etc).
- RESPEITE a estrutura existente do projeto.
- Seja especifico nos testes de cada feature — criterios vagos sao inuteis.
- Priorize features que desbloqueiam outras (dependencias primeiro).
- Artefatos de STATUS ficam no ROOT (.harness/runs/{session}/), NAO dentro da worktree.
- A worktree contem APENAS codigo e agent-setup.sh.
