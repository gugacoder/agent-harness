---
status: current
---

# PRP-wave-1-close — Fechar wave 1 e disparar proxima

## Objetivo

Fechar a wave 1 e disparar o Harness A para a wave 2.

## Execution Mode

`encadear`

## Especificacao

### F-001 — Validacao e2e final (agent=coder)

1. Rodar todos os testes do projeto (unit, integration, e2e)
2. Verificar branding: logo SVG + cores #222e6e/#1dace7/#fca322
3. Se falhas: corrigir e re-testar ate passing
4. Commit com estado limpo

### F-002 — Fechar wave e disparar Harness A (agent=general)

1. git tag wave-1
2. Atualizar `.projeto/wave-1/ranking.json` marcando discoveries implementadas nesta wave (campo `implemented_at: 1`)
3. Criar pasta `.projeto/wave-2/`
4. Disparar Harness A para wave 2:
   - `vibe:worktree .projeto/wave-0/4-prps/PRP-experimento-chegala.md --session wave-2-research`
   - `vibe:plan`
   - `vibe:spawn`
5. Marcar feature como passing — Harness B encerrado, Harness A assume

## Limites

- NAO implementar features do app — isso ja foi feito
- NAO modificar scripts do harness
- O PRP referenciado no vibe:worktree e SEMPRE `.projeto/wave-0/4-prps/PRP-experimento-chegala.md` (este eh o blueprint permanente do Harness A)
