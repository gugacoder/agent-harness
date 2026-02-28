---
allowedTools: Edit,Write,Bash,Read,Glob,Grep
max_turns: 200
rollback: stash
---

# Realiza uma sessao de desenvolvimento incremental

Voce e o CODING AGENT para uma sessao de desenvolvimento incremental.

## Protocolo de Startup (faca NESTA ORDEM, sem pular):

1. `cat {runs_dir}/config.json` — veja a configuracao do run
2. `pwd` — confirme o diretorio do projeto (worktree)
3. `cat {runs_dir}/progress.txt` — entenda o estado atual
4. `cat {runs_dir}/features.json` — veja a feature list
5. `git log --oneline -10` — veja mudancas recentes
6. `bash agent-setup.sh` — suba o ambiente
7. Faca um SMOKE TEST da funcionalidade existente antes de codar qualquer coisa nova

## Sua Missao

Selecione a feature de MAIOR PRIORIDADE com status "failing" cujas dependencias estejam todas "passing", e implemente-a completamente nesta sessao.

## Regras

- UMA feature por sessao. Foque e termine.
- TESTE antes de marcar como passing — rode os testes definidos na feature.
- Se encontrar bugs de sessoes anteriores, CORRIJA PRIMEIRO antes de avancar.
- Consulte o `specs` de `{runs_dir}/config.json` para referencias tecnicas e specs quando precisar de contexto durante a implementacao. Se a feature tiver `prp_path`, leia o PRP para detalhes.
- Consulte `.harness/learnings.md` para licoes aprendidas de sessoes anteriores.
- Ao FINAL da sessao:
  1. Atualize `{runs_dir}/features.json` (status da feature para "passing" + completed_at)
  2. Atualize `{runs_dir}/progress.txt` (registre o que fez, proxima prioridade)
  3. Git commit com estado limpo
  4. O codigo deve estar num estado que outro agente possa continuar sem limpar bagunca

## Formato do Commit

```
feat(<escopo>): implementar F-XXX <nome da feature>

- O que foi implementado
- Testes que passaram
- Qualquer decisao arquitetural tomada

Progress: X/N features complete
Next: F-YYY <proxima feature>
```

Comece executando o protocolo de startup agora.
