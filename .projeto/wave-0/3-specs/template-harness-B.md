# Template Harness B — Implementation

## Quando usar

Este template e aplicado apos o Harness A gerar os PRPs do app. Ele implementa cada PRP em worktree isolada, valida, e ao final dispara o Harness A da wave seguinte.

## Quem dispara

O F-005 do Harness A da mesma wave.

## Como funciona

O Harness B nao e um unico harness — sao N harness (um por PRP) encadeados via `vibe:spawn+merge` ou `vibe:run+merge`. Cada PRP do app e processado pelo pipeline normal:

```
PRP-001 do app → vibe:worktree → vibe:plan → vibe:spawn → vibe:merge
PRP-002 do app → vibe:worktree → vibe:plan → vibe:spawn → vibe:merge
...
PRP-wave-close → vibe:worktree → vibe:plan → vibe:spawn → vibe:merge
```

O ultimo PRP da fila e sempre o PRP de encadeamento (PRP-wave-{N}-close.md), criado pelo F-005 do Harness A.

## Features por PRP do app

Geradas pelo `vibe:plan` a partir de cada PRP. O pipeline normal se aplica:

1. Implementar codigo (agent=coder)
2. Testar (unit, integration, e2e)
3. Corrigir bugs se testes falharem
4. Commit com estado limpo
5. Merge via `vibe:merge`

## PRP de encadeamento

O Harness A cria este PRP automaticamente em `.projeto/wave-{N}/prps/PRP-wave-{N}-close.md`. Seu conteudo deve ser:

```markdown
---
status: current
---

# PRP-wave-{N}-close — Fechar wave {N} e disparar proxima

## Objetivo

Fechar a wave {N} e disparar o Harness A para a wave {N+1}.

## Execution Mode

`encadear`

## Especificacao

### F-001 — Validacao e2e final (agent=coder)

1. Rodar todos os testes do projeto (unit, integration, e2e)
2. Verificar branding: logo SVG + cores #222e6e/#1dace7/#fca322
3. Se falhas: corrigir e re-testar ate passing
4. Commit com estado limpo

### F-002 — Fechar wave e disparar Harness A (agent=general)

1. git tag wave-{N}
2. Atualizar `.projeto/wave-{N}/ranking.json` marcando discoveries implementadas nesta wave (campo `implemented_at: {N}`)
3. Criar pasta `.projeto/wave-{N+1}/`
4. Disparar Harness A para wave {N+1}:
   - `vibe:worktree .projeto/wave-0/4-prps/PRP.md --session wave-{N+1}-research`
   - `vibe:plan`
   - `vibe:spawn`
5. Marcar feature como passing — Harness B encerrado, Harness A assume

## Limites

- NAO implementar features do app — isso ja foi feito
- NAO modificar scripts do harness
- O PRP referenciado no vibe:worktree e SEMPRE `.projeto/wave-0/4-prps/PRP.md` (este eh o blueprint permanente do Harness A)
```

## Ciclo completo

```
Harness A (wave-1):
  research → decision(go) → specs → PRPs → cria PRP-wave-1-close → dispara B

Harness B (wave-1):
  PRP-001-app → implement → merge
  PRP-002-app → implement → merge
  PRP-wave-1-close → e2e final → git tag → dispara Harness A wave-2

Harness A (wave-2):
  research → decision(go) → specs → PRPs → cria PRP-wave-2-close → dispara B

...

Harness A (wave-N):
  research → decision(stop) → skipped → encerrado
```
