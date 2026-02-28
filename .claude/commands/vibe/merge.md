# Merge-back de worktree para o parent workspace

Voce e o MERGE-BACK AGENT — finaliza uma sprint fazendo push, merge e cleanup da worktree.

Argumentos: $ARGUMENTS

Formato esperado: `<prp-path>` ou `<slug>`

## Passo 0 — Resolver argumento

**Deteccao de tipo:**
- Contem `/` ou termina com `.md` → **PRP path** → derive slug do stem do arquivo (sem .md), ou do diretorio pai se for `PRP.md`
- Caso contrario → **slug**

Derive:
- **slug**: nome derivado do argumento
- **session**: `{slug}--cc`
- **worktree**: `.harness/worktrees/{slug}/`
- **runs_dir**: `.harness/runs/{session}/` (ROOT)

## Passo 1 — Carregar config e validar

1. Leia `.harness/runs/{session}/config.json` (ROOT)
2. Extraia `parent_workspace`, `parent_branch` e `prp_path`
3. Leia `.harness/runs/{session}/features.json` (ROOT)
4. Verifique que TODAS as features estao `passing` ou `skipped`
   - Se ha features `pending`, `failing`, `in_progress` ou `blocked` → **PARE** e reporte que o loop nao completou

### GATE — Verificar ANTES de prosseguir

```
[ ] config.json existe no ROOT e tem parent_workspace
    → Verificar: cat .harness/runs/{session}/config.json
[ ] features.json existe no ROOT e todas features sao passing/skipped
    → Verificar: grep -c '"status"' e confirmar nenhum pending/failing/blocked/in_progress
[ ] Worktree existe: ls .harness/worktrees/{slug}/CLAUDE.md
[ ] Branch existe: git branch --list harness/{slug}
```

Se QUALQUER gate falha → PARE e reporte.

## Passo 2 — Push da worktree

```bash
cd .harness/worktrees/{slug}
git push origin harness/{slug}
```

## Passo 3 — Gravar finished_at no config.json

Antes de remover a worktree, grave `finished_at` (ISO 8601) no config.json no ROOT:

```bash
# Atualize .harness/runs/{session}/config.json adicionando "finished_at": "<timestamp>"
```

Use o Edit tool para adicionar o campo `finished_at` ao JSON.

## Passo 4 — Voltar ao parent workspace e merge

```bash
cd {parent_workspace}   # do config.json
git merge harness/{slug} --no-ff -m "feat({slug}): merge harness/{slug}"
```

## Passo 5 — Avaliar resultado do merge e cleanup

### Se merge limpo (sem conflitos):

1. Remover worktree:
   ```bash
   git worktree remove .harness/worktrees/{slug}
   ```
2. Deletar branch local:
   ```bash
   git branch -d harness/{slug}
   ```
3. Atualizar frontmatter do PRP para `finished`:
   - Leia o arquivo PRP (use `prp_path` do config.json, ou resolva via glob `.projeto/PRPs/**/{slug}.md`)
   - Atualize o frontmatter YAML: `status: finished` e `finished_at: {ISO_8601_date}`
   - Preserve todos os outros campos do frontmatter
   - Commit:
     ```
     chore(harness): finalizar {slug} — status → finished
     ```
4. Reporte: "Sprint {slug} finalizada com sucesso!"

### Se conflito no merge:

1. Reporte os arquivos conflitantes ao usuario
2. **SEMPRE** remover worktree (mesmo com conflito):
   ```bash
   git worktree remove --force .harness/worktrees/{slug}
   ```
3. Deletar branch local:
   ```bash
   git branch -d harness/{slug}
   ```
4. Instrua o usuario a resolver os conflitos no parent workspace
5. NAO tente resolver conflitos automaticamente

## Regras

- SEMPRE remova a worktree ao final, independente de conflito ou sucesso
- SEMPRE grave `finished_at` ANTES de remover a worktree
- NAO tente resolver conflitos de merge — apenas reporte e remova a worktree
- TODO o merge acontece no parent workspace, NUNCA na worktree
- O push acontece DENTRO da worktree (antes do merge)
- Status files (`.harness/runs/{session}/`) ficam no ROOT e NAO sao removidos (historico)
