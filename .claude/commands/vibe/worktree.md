# Cria worktree isolada + scaffold .harness/ para um PRP

Argumentos: $ARGUMENTS

Formato esperado: `<prp-path>` ou `<slug>`

Exemplo: `/kai:vibe:worktree .projeto/PRPs/M5-seo-analytics-golive.md`

## O que fazer

### 1. Parse dos argumentos

Extraia do `$ARGUMENTS`:
- **input**: o argumento recebido (pode ser um PRP path ou um slug)

**Deteccao de tipo:**
- Contem `/` ou termina com `.md` → **PRP path** (`prp_path`)
- Caso contrario → **slug** (procure o PRP com glob: `.projeto/PRPs/**/{slug}.md` ou `.projeto/PRPs/**/{slug}/PRP.md`)

Se nenhum argumento, peca ao usuario:
- "Qual o caminho do PRP? (ex: `.projeto/PRPs/M5-seo-analytics-golive.md`)"

### 2. Derivar nomes

A partir do PRP path:
- **slug**: stem do arquivo sem extensao (ex: `M5-seo-analytics-golive.md` → `M5-seo-analytics-golive`), ou nome do diretorio pai se o PRP for `PRP.md`
- **session**: `{slug}--cc`
- **branch**: `harness/{slug}`
- **worktree_path**: `.harness/worktrees/{slug}/`
- **runs_dir**: `.harness/runs/{session}/` (root — gestao centralizada de status)
- **parent_workspace**: resultado de `pwd` (diretorio atual, absoluto)
- **parent_branch**: branch atual (`git branch --show-current`)

### 3. Validar

- Confirme que o arquivo PRP existe (leia-o brevemente para validar)
- Se o PRP estiver numa pasta com outros arquivos (specs, refs), anote esse diretorio como `specs`

### 4. PRP Lifecycle — atualizar frontmatter para `current`

Leia o PRP e verifique se tem frontmatter YAML (bloco `---` no inicio do arquivo).

**Se o frontmatter NAO existe ou `status` != `current`/`finished`:**
1. Atualize (ou adicione) o frontmatter YAML no inicio do arquivo:
   ```yaml
   ---
   status: current
   started_at: {ISO_8601_date}
   finished_at:
   ---
   ```
   - Se o arquivo ja tem frontmatter, preserve campos existentes e apenas atualize `status` e `started_at`
   - Se o arquivo NAO tem frontmatter, adicione o bloco `---` antes do conteudo existente
2. Commit no parent workspace:
   ```
   chore(harness): iniciar {slug} — status → current
   ```

**Se `status` ja e `current` ou `finished`:** pule este passo.

### 5. Verificar worktree existente

Execute `git worktree list` e verifique se `.harness/worktrees/{slug}` ja existe.
- Se sim, reporte que a worktree ja existe e pule para o passo 7 (verificar scaffold)
- Se nao, continue para o passo 6

### 6. Criar worktree

```bash
git worktree add .harness/worktrees/{slug} -b harness/{slug}
```

Se a branch `harness/{slug}` ja existe, use:
```bash
git worktree add .harness/worktrees/{slug} harness/{slug}
```

### 7. Copiar .env e ajustar portas para isolamento

O worktree precisa de um `.env` proprio com portas diferentes do parent para que ambos possam rodar simultaneamente.

1. Copie o `.env` do parent para a worktree:
   ```bash
   cp .env .harness/worktrees/{slug}/.env
   ```

2. Aplique um **offset de +100** em TODAS as portas de servicos de aplicacao (`./apps`):
   - `FRONTEND_PORT` — ex: 8001 → 8101
   - `CENTRAL_PORT` — ex: 8002 → 8102
   - `BACKEND_PORT` — ex: 8003 → 8103
   - `BACKBONE_PORT` — ex: 8004 → 8104
   - `GATEWAY_PORT` — ex: 8005 → 8105

   Use `sed` (ou Edit tool) para substituir cada valor no `.env` copiado.

3. **NAO altere portas de infraestrutura** (MySQL, PostgreSQL, Redis, etc.) — a worktree usa os mesmos servicos de plataforma do parent.

4. Se o `.env` contiver linhas duplicadas (ex: `BACKBONE_PORT` aparece mais de uma vez), ajuste TODAS as ocorrencias consistentemente.

### 8. Criar config.json no ROOT (gestao centralizada)

Crie `.harness/runs/{session}/config.json` (**no root**, NAO dentro da worktree):

```json
{
  "slug": "{session}",
  "project": "{slug}",
  "session_name": "{session}",
  "prp_path": "{prp_absolute_path}",
  "specs": "{specs_absolute_path}",
  "worktree": "{worktree_absolute_path}",
  "parent_workspace": "{parent_workspace_absolute_path}",
  "parent_branch": "{parent_branch_name}",
  "branch": "harness/{slug}",
  "created_at": "{ISO_8601_timestamp}",
  "agent": {
    "harness": "claude-code",
    "profile": null,
    "model": null,
    "max_turns": 200,
    "max_iterations": null,
    "max_retries": 5,
    "rollback": "stash"
  },
  "notifications": []
}
```

Use caminhos absolutos para `prp_path`, `specs`, `worktree`, e `parent_workspace`.

### 9. Confirmar

Reporte:
- Worktree criada: `.harness/worktrees/{slug}/`
- Runs dir (status): `.harness/runs/{session}/`
- Branch: `harness/{slug}`
- Session: `{session}`
- Config: `.harness/runs/{session}/config.json`
- PRP: `{prp_path}` (frontmatter: `status: current`)
- Specs dir: `{specs}`
- Parent workspace: `{parent_workspace}`
- Parent branch: `{parent_branch}`
- Proximo passo: `/kai:vibe:plan {slug}`

## GATE — Checklist de verificacao (OBRIGATORIO antes de reportar sucesso)

Antes de reportar que o create foi concluido, verifique CADA item abaixo.
Se QUALQUER item falhar, PARE e corrija antes de prosseguir.

```
[ ] PRP existe e frontmatter tem `status: current`
    → Verificar: leia o inicio do arquivo PRP e confirme o frontmatter
[ ] Commit do frontmatter foi feito no PARENT workspace (se status mudou)
    → Verificar: git log --oneline -1 (deve mostrar "iniciar {slug}" no parent)
[ ] Worktree existe em .harness/worktrees/{slug}/
    → Verificar: ls .harness/worktrees/{slug}/
[ ] Branch harness/{slug} existe
    → Verificar: git branch --list harness/{slug}
[ ] .env copiado para worktree com portas isoladas (+100 offset)
    → Verificar: grep FRONTEND_PORT .harness/worktrees/{slug}/.env (deve ser diferente do parent)
[ ] config.json criado no ROOT .harness/runs/{session}/
    → Verificar: ls .harness/runs/{session}/config.json
[ ] config.json contem worktree com path absoluto
    → Verificar: grep worktree .harness/runs/{session}/config.json
[ ] config.json contem parent_workspace com path absoluto
    → Verificar: grep parent_workspace .harness/runs/{session}/config.json
```

Se todos passam → reporte sucesso e proximo passo.
Se algum falha → corrija e re-verifique.

## Regras

- NAO gere features.json — isso e trabalho do `/kai:vibe:plan`
- NAO gere progress.txt — isso e trabalho do `/kai:vibe:plan`
- NAO leia nem implemente nada do PRP — apenas valide que existe
- NAO modifique codigo existente do projeto
- NAO copie .harness/scripts/ ou agents/ para a worktree — scripts e agents ficam apenas no root
- O unico artefato de harness e o `config.json` (em `.harness/runs/{session}/`)
- O commit de PRP lifecycle acontece NO PARENT WORKSPACE (nao na worktree)
