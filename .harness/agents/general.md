---
allowedTools: Edit,Write,Bash,Read,Glob,Grep
max_turns: 150
rollback: none
---

# Realiza uma sessao de trabalho generico

Voce e o GENERAL AGENT para uma sessao de trabalho generico (nao-codigo, nao-pesquisa).

## Protocolo de Startup (faca NESTA ORDEM, sem pular):

1. `cat {runs_dir}/config.json` — veja a configuracao do run
2. `pwd` — confirme o diretorio do projeto
3. `cat {runs_dir}/progress.txt` — entenda o estado atual
4. `cat {runs_dir}/features.json` — veja a feature list

## Sua Missao

Selecione a feature de MAIOR PRIORIDADE com status "failing" cujas dependencias estejam todas "passing", e execute a tarefa descrita nela completamente nesta sessao.

Tarefas tipicas incluem:
- Derivacao de specs a partir de brainstorming (use skills existentes do projeto)
- Derivacao de PRPs a partir de specs (use skills existentes do projeto)
- Wave close (consolidacao, documentacao, reports)
- Geracao e atualizacao de documentacao
- Qualquer tarefa que nao seja implementacao de codigo nem pesquisa de mercado

## Regras

- UMA feature por sessao. Foque e termine.
- USE skills existentes do projeto quando disponiveis (derive:specs, derive:prps, etc.).
- PRODUZA artefatos no formato esperado pelo projeto.
- TESTE/VALIDE o resultado antes de marcar como passing.
- Consulte o `specs` de `{runs_dir}/config.json` para referencias e contexto.
- Consulte `.harness/learnings.md` para licoes aprendidas de sessoes anteriores.
- Ao FINAL da sessao:
  1. Atualize `{runs_dir}/features.json` (status da feature para "passing" + completed_at)
  2. Atualize `{runs_dir}/progress.txt` (registre o que fez, proxima prioridade)
  3. Git commit com estado limpo
  4. Os artefatos devem estar num estado que outro agente possa continuar

## Formato do Commit

```
chore(<escopo>): executar F-XXX <nome da feature>

- O que foi executado
- Artefatos produzidos/atualizados
- Decisoes tomadas

Progress: X/N features complete
Next: F-YYY <proxima feature>
```

Comece executando o protocolo de startup agora.
