# Experimento: Macro Harness — App de Entregas

## Objetivo

Criar um app de entregas perfeito e funcional para empresários donos de empresas de entregas rápidas — partindo do zero, com caminho indefinido e objetivo definido.

O experimento é a **gestão do indefinido**: não sabemos de antemão quais parâmetros compõem o conceito de "pronto" do app final. A cada iteração completa (da análise do cliente até o incremento implementado), aprendemos algo e adicionamos ao conceito do app.

## Conceito de Pronto — Emergente

O "pronto" não é definido upfront. É construído iterativamente:

```
|> início ... iterações ... pronto |
```

A cada iteração, o inicializador reavalia as dores/ganhos do cliente e reclassifica todas as descobertas acumuladas num ranking de 1 a 10:

- **1** = dor/ganho menos relevante
- **10** = dor/ganho mais relevante

**Critério de parada (threshold):** se, ao final da análise, nenhuma descoberta nova ultrapassa o threshold (ex: 3), o produto está suficiente. Não há incremento relevante a implementar. O experimento termina.

## Modelo Fundamental

O harness é um **processo**. O agente é um **parâmetro**.

```
harness := init(prp) → run-loop(agent)
```

- **init** é sempre o mesmo — lê o PRP, decompõe em features.json, prepara memória e ambiente. Não precisa de internet. O trabalho intelectual pesado já foi feito por quem escreveu o PRP.
- **run-loop** recebe o agente como parâmetro. O init analisa o PRP e decide qual agente é adequado para executar as features.

O init é o **cérebro estratégico**: entende a natureza do trabalho e seleciona o agente certo. Um PRP de código aciona o `coder`. Um PRP de pesquisa aciona o `researcher`. Um PRP de documentação aciona o `writer`.

## Agentes como Arquivos Auto-Contidos

Cada agente é um markdown com frontmatter YAML que define seus parâmetros e o body que define sua identidade (prompt):

```
.harness/agents/
  coder.md
  researcher.md
  spec-writer.md
  prp-writer.md
  writer.md
```

Exemplo — `coder.md`:

```markdown
---
allowedTools: Edit,Write,Bash,Read,Glob,Grep
max_turns: 200
rollback: stash
---

# Coding Agent

Você é o CODING AGENT para uma sessão de desenvolvimento incremental.

## Protocolo de Startup
...
```

Exemplo — `researcher.md`:

```markdown
---
allowedTools: WebSearch,WebFetch,Read,Write,Bash,Glob,Grep
max_turns: 100
rollback: none
---

# Research Agent

Você é o RESEARCH AGENT para uma sessão de investigação de mercado.

## Protocolo de Startup
...
```

O `run.mjs` lê o arquivo do agente, parseia o frontmatter YAML para config (allowedTools, max_turns, etc.), e usa o body markdown como prompt. **Um arquivo = um agente completo.** Identidade + parâmetros.

O `config.json` da session referencia apenas o profile:

```json
{
  "agent": {
    "profile": "coder"
  }
}
```

O `run.mjs` resolve para `.harness/agents/coder.md` e extrai tudo de lá.

## Mudanças Necessárias no Harness Atual

O motor (loop.mjs) é genérico e não precisa de mudanças. As mudanças são cirúrgicas no `run.mjs`:

| Mudança | O que fazer |
|---------|-------------|
| **Prompt configurável** | `run.mjs` lê `config.agent.profile`, resolve para `.harness/agents/{profile}.md`, usa o body como prompt |
| **allowedTools configurável** | `run.mjs` lê do frontmatter do agente ao invés de hardcoded |
| **Migrar prompt.md atual** | Renomear `.harness/prompt.md` → `.harness/agents/coder.md` com frontmatter |
| **Fallback** | Se `config.agent.profile` não existir, usar `coder` como default (retrocompatível) |

O `init.mjs` e `loop.mjs` permanecem inalterados.

## Arquitetura: Dois Níveis de Harness

### Nível 1 — Macro Harness

O features.json do nível 1 é **vivo** — cresce a cada wave. O loop.mjs já lida com isso: ele vê pendências novas e continua.

### Nível 2 — Micro Harness (existente)

O harness atual (features.json → loop.mjs → feature por feature) operando em worktrees isoladas dentro da worktree do executor.

## Waves

Cada ciclo completo de análise → implementação é uma **wave**. Waves são a unidade de progresso do macro harness.

### Anatomia de uma Wave

```
features.json (nível 1):

  Wave 1:
  F-001: research dores/ganhos           → agent=researcher
  F-002: gen-specs                       → agent=spec-writer
  F-003: gen-prps                        → agent=prp-writer
  F-004: vibe (implementação)            → agent=coder
  F-005: validate & fix (test + refactor)→ agent=coder
  F-006: close wave & plan next          → git tag + templateia F-007..F-012

  Wave 2 (adicionada por F-006):
  F-007: research dores/ganhos           → agent=researcher
  F-008: gen-specs                       → agent=spec-writer
  F-009: gen-prps                        → agent=prp-writer
  F-010: vibe                            → agent=coder
  F-011: validate & fix                  → agent=coder
  F-012: close wave & plan next          → git tag + templateia ou STOP

  ...
```

### F-005: Validate & Fix

Mais do que testar — é o ciclo de **validação e correção**:
1. Rodar testes e2e
2. Identificar falhas
3. Refatorar e corrigir
4. Re-testar até passing

O agente não apenas reporta erros — ele os resolve.

### F-006: Close Wave & Plan Next

A feature de fechamento faz duas coisas:

1. **Marca o milestone no git:**
   ```bash
   git tag wave-1
   ```

2. **Decide continuar ou parar:**
   - Lê o resultado do research da wave atual (ranking acumulado)
   - Se o research da wave concluiu que não há dor/ganho acima do threshold → **não templateia mais features**. O loop.mjs vê tudo passing/skipped e encerra.
   - Se há trabalho relevante → adiciona F-007..F-012 ao features.json (nova wave)

### Critério de Parada (STOP)

O STOP é decidido pelo **research agent** (F-001/F-007/etc.). Ao concluir a pesquisa, se ele determina que não há descoberta nova acima do threshold, ele marca as features seguintes da wave (gen-specs, gen-prps, vibe, validate, close) como `skipped`.

O loop.mjs vê tudo como passing/skipped e encerra naturalmente. **Zero scripts novos.**

```
Cenário STOP na wave 3:

  F-013: research dores/ganhos (wave 3) → passing
         (researcher conclui: nada acima do threshold)
         (marca F-014..F-018 como skipped)
  F-014: gen-specs                      → skipped
  F-015: gen-prps                       → skipped
  F-016: vibe                           → skipped
  F-017: validate & fix                 → skipped
  F-018: close wave & plan next         → skipped

  → loop.mjs: tudo passing/skipped → exit(0)
```

## Fluxo Visual

```
┌─────────────────────────────────────────────────────┐
│  MACRO HARNESS — features.json vivo                 │
│                                                     │
│  Wave 1                                             │
│  ┌────────────────────────────────────────────────┐ │
│  │ F-001 research      → agent=researcher         │ │
│  │ F-002 gen-specs     → agent=spec-writer        │ │
│  │ F-003 gen-prps      → agent=prp-writer         │ │
│  │ F-004 vibe          → agent=coder              │ │
│  │ F-005 validate&fix  → agent=coder              │ │
│  │ F-006 close wave    → git tag wave-1           │ │
│  │                       + templateia wave 2      │ │
│  └────────────────────────────────────────────────┘ │
│                       ↓                             │
│  Wave 2 (adicionada ao features.json)               │
│  ┌────────────────────────────────────────────────┐ │
│  │ F-007 research      → agent=researcher         │ │
│  │   (threshold ok? → se não: skip F-008..F-012)  │ │
│  │ F-008 gen-specs     → agent=spec-writer        │ │
│  │ F-009 gen-prps      → agent=prp-writer         │ │
│  │ F-010 vibe          → agent=coder              │ │
│  │ F-011 validate&fix  → agent=coder              │ │
│  │ F-012 close wave    → git tag wave-2           │ │
│  │                       + templateia wave 3      │ │
│  └────────────────────────────────────────────────┘ │
│                       ↓                             │
│  Wave N: research conclui STOP                      │
│  → skip restante → loop encerra                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Worktrees Aninhadas

```
repo principal
└── .harness/worktrees/{macro-session}/        ← worktree do macro
    └── .harness/worktrees/{feature-session}/   ← worktree do micro (nível 2)
```

O executor macro opera na sua worktree. Cada harness nível 2 que ele dispara cria uma worktree dentro desta.

## Estado e Memória

### Ranking Acumulado

Arquivo persistente com todas as dores/ganhos descobertas, classificadas e reclassificadas a cada wave:

```json
{
  "wave": 3,
  "discoveries": [
    {
      "id": "D-001",
      "type": "pain",
      "description": "Falta de visibilidade do entregador em tempo real",
      "score": 9,
      "discovered_at": 1,
      "last_reclassified_at": 3
    }
  ],
  "threshold": 3,
  "decision": "go"
}
```

### Git Tags como Milestones

Cada wave concluída é marcada com uma tag:

```
wave-1  ← primeira iteração completa (research → vibe → validate)
wave-2  ← segunda iteração
wave-N  ← última iteração (research decidiu STOP)
```

Tags permitem navegar o histórico por ciclo completo, fazer diff entre waves, e entender a evolução do produto.

## Por que Dois Níveis e Não Três

Um terceiro nível (separando investigação do cliente da inicialização) adiciona complexidade sem ganho:

- O nível mais alto faria só duas coisas: disparar investigação e decidir. Fino demais para justificar um nível inteiro.
- O resultado da investigação é input direto para o planejamento das features. Separar cria costura desnecessária.
- A classificação + threshold é naturalmente o critério de aceite do inicializador.

## Por que Nenhum Script Novo

O features.json vivo resolve o macro loop sem macro-loop.mjs:

- Features podem adicionar features → o agente edita features.json, o loop.mjs pega as novas pendências
- O research agent tem autoridade pra skipar o restante quando threshold é atingido
- O loop.mjs encerra quando tudo é passing/skipped — mecânica já existente
- O init gera a wave 1. Daí em diante o loop se auto-alimenta.

## Critério de Sucesso do Experimento

O experimento é bem-sucedido quando:

1. O macro harness consegue iterar autonomamente do zero até um produto funcional
2. O threshold funciona como gate eficaz — para quando não há mais incremento relevante
3. O ranking acumulado converge — as reclassificações estabilizam
4. O app resultante atende de fato aos empresários de entregas rápidas
