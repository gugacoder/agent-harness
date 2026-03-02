# Experimento: Macro Harness — Chega.la

## Objetivos

- Validar que o macro harness consegue construir um produto funcional do zero, autonomamente, sem definicao previa de "pronto"
- Validar que o conceito de pronto emergente funciona — waves iteram, ranking acumula, threshold para quando nao ha mais incremento relevante
- Validar que 3 agentes genericos (coder, researcher, general) com descricoes de tarefa ricas resolvem todo o ciclo sem agentes especializados
- Produzir o Chega.la funcional — 3 modulos sincronizados via SSE, com branding aplicado, pronto para o primeiro cliente real

## O Experimento

Construir o Chega.la — app de entregas completo para empresarios de entregas rapidas — partindo do zero, sem definicao previa do que "pronto" significa.

O experimento e a **gestao do indefinido**. Nao sabemos de antemao quais funcionalidades compoem o produto final. A cada iteracao completa (pesquisa do cliente → specs → PRPs → implementacao → validacao), aprendemos algo, adicionamos ao conceito do produto, e decidimos se ha mais a fazer.

**Conceito de pronto — emergente.** O "pronto" e construido iterativamente. A cada wave, o researcher reavalia as dores e ganhos do cliente-alvo e reclassifica todas as descobertas acumuladas. Quando a reflexao do researcher conclui que nao ha mais incremento relevante, o produto esta suficiente e o experimento termina. O threshold nao e um valor pre-configurado — e uma conclusao emergente do researcher a cada wave (ver "Reflexao de Threshold" abaixo).

## O Produto: Chega.la

O Chega.la e um app inteligente para empresas de entregas rapidas. Substitui o caos do WhatsApp por uma operacao estruturada com IA progressiva. Tres modulos sincronizados em tempo real via backbone SSE:

| Modulo | Usuario | Funcao |
|---|---|---|
| Central da Empresa | Operador/gestor | Painel completo: pedidos, entregas, motoboys, financeiro |
| App do Lojista | Cliente da empresa | Solicitar e acompanhar entregas sem WhatsApp |
| App do Motoboy | Entregador | Gerenciar entregas, rotas, localizacao em tempo real |

### Branding — OBRIGATORIO

O app DEVE aplicar a identidade visual do Chega.la: logomarca (SVGs, nunca texto generico), cores (Primary #222e6e, Secondary #1dace7, Accent #fca322). Um app sem branding e um fracasso do experimento.

### Documentos de Referencia

Os documentos abaixo fornecem a compreensao completa do Chega.la. Qualquer agente que precise entender o produto, o cliente, a marca ou a arquitetura DEVE consulta-los:

| Documento | Path | O que contem |
|---|---|---|
| Objetivo Norte | `.projeto/1-brainstoming/draft-objetivo-norte.md` | Visao do produto, 3 modulos, publico-alvo, criterio de pronto funcional |
| Documento Comercial | `.projeto/1-brainstoming/documentos/chega.la.md` | Ecossistema, IA progressiva, proposta de valor |
| Landing Page | `.projeto/1-brainstoming/documentos/LANDING_PAGE.md` | Dores do cliente, solucao, funcionalidades, diferenciais |
| Concorrente | `.projeto/1-brainstoming/documentos/Concorrente - Entregas Expressas.md` | Referencia de mercado, funcionalidades do concorrente |
| Brand Assets | `.projeto/1-brainstoming/documentos/BRAND.md` (via objetivo-norte) | Cores, variantes de logo, assets SVG |
| Infraestrutura | `.projeto/1-brainstoming/draft-design-infraestrutura.md` | Regras arquiteturais: Zod source of truth, REST+SSE, Supabase, Drizzle, Hono |
| Stack Tecnica | `.projeto/1-brainstoming/draft-stack-backbone-schemas.md` | Schemas Zod, Drizzle, OpenAPI, SSE channels, estrutura monorepo |

**Regra:** ao iniciar qualquer wave, o agente responsavel DEVE ler estes documentos para absorver contexto antes de agir.

## O Metodo

### Modelo Fundamental

O harness e um **processo**. O agente e um **parametro**.

```
harness := plan(prp) → run-loop(agent)
```

- **plan** le o PRP, decompoe em features.json, seleciona o agente adequado para cada feature.
- **run-loop** recebe o agente e executa as features uma a uma. O mesmo motor (loop.mjs) serve para qualquer agente.

O plan e o cerebro estrategico: entende a natureza do trabalho e cria descricoes de tarefas ricas o suficiente para que o agente generico execute sem precisar de conhecimento especial.

### Tres Agentes

Cada agente e um arquivo markdown auto-contido em `.harness/agents/`. O frontmatter YAML define parametros (allowedTools, max_turns, rollback). O body define a identidade (prompt).

**coder.md** — Implementacao de codigo. Testa antes de marcar passing. Comita com estado limpo.
```yaml
allowedTools: Edit,Write,Bash,Read,Glob,Grep
max_turns: 200
rollback: stash
```

**researcher.md** — Pesquisa de mercado e cliente. Produz brainstorming, ranking acumulado. Classifica 1-10. Pode skipar features da wave se threshold atingido.
```yaml
allowedTools: WebSearch,WebFetch,Read,Write,Bash,Glob,Grep
max_turns: 100
rollback: none
```

**general.md** — Tudo que nao e codigo nem pesquisa. Executa a tarefa como descrita na feature. Usa skills existentes do projeto (derive:specs, derive:prps, etc.).
```yaml
allowedTools: Edit,Write,Bash,Read,Glob,Grep
max_turns: 150
rollback: none
```

**A inteligencia esta na descricao da tarefa, nao no agente.** O general nao precisa saber fechar waves — o inicializador descreve exatamente o que a tarefa de close-wave deve fazer, e o general executa.

### Resolucao de Agentes

O `run.mjs` resolve qual agente usar via fallback chain:

1. `feature.agent` → override por feature individual
2. `config.agent.profile` → profile da session
3. `"coder"` → fallback default

Resolve para `.harness/agents/{profile}.md`, parseia frontmatter, usa body como prompt.

### Pipeline de Comandos

```
vibe:worktree → vibe:plan → vibe:run | vibe:spawn → vibe:merge
```

| Comando | O que faz |
|---|---|
| `vibe:worktree` | Cria worktree isolada, .env com portas +100, config.json |
| `vibe:plan` | Decompoe PRP em features.json, seleciona agent profiles, cria progress.txt |
| `vibe:run` | Loop inline — itera features na mesma conversa |
| `vibe:spawn` | Loop externo — loop.mjs spawna processos Claude por feature |
| `vibe:merge` | Push, merge no parent, cleanup worktree |
| `vibe:run+merge` | Run + merge encadeado (suporta fila de PRPs) |
| `vibe:spawn+merge` | Spawn + merge encadeado (suporta fila de PRPs) |

**run vs spawn:** `run` e sincrono na mesma conversa (debug, controle direto). `spawn` e assincrono via processos externos (runs longos, desatendidos).

## Waves: O Ciclo Iterativo

Cada ciclo completo de analise → implementacao e uma **wave**. Waves sao a unidade de progresso do macro harness. O features.json e **vivo** — cresce a cada wave.

### Anatomia de uma Wave

```
Wave N:
  F-XX1: research dores/ganhos     → agent=researcher
  F-XX2: derivar specs             → agent=general
  F-XX3: derivar PRPs              → agent=general
  F-XX4: implementar (vibe)        → agent=coder
  F-XX5: validar e corrigir        → agent=coder
  F-XX6: fechar wave               → agent=general
```

Cada feature depende da anterior (dependencies chain). O loop.mjs respeita dependencias automaticamente.

### O Papel do Inicializador

O `vibe:plan` e responsavel por criar descricoes de tarefas **ricas o suficiente** para que cada agente execute sem conhecimento previo. A descricao da tarefa e o contrato. Abaixo, o que cada tipo de tarefa DEVE conter na descricao:

#### Tarefa: Research (agent=researcher)

```
Descricao da feature:
- Ler os documentos de referencia do produto (listar paths)
- Ler ranking acumulado de waves anteriores ({runs_dir}/ranking.json), se existir
- Investigar dores e ganhos do cliente-alvo (empresarios de entregas rapidas)
- Analisar concorrentes e alternativas
- Produzir brainstorming.md em {runs_dir}/wave-N/brainstorming.md
- Atualizar {runs_dir}/ranking.json com todas as descobertas (novas e reclassificadas), score 1-10

REFLEXAO DE THRESHOLD — responda a cada pergunta ANTES de decidir continuar ou parar:

1. A quantidade de waves ate o momento e razoavel para uma analise de threshold?
   (Nas primeiras waves a resposta e NAO — continue iterando. O produto precisa de
   massa critica antes de avaliar parada.)
   → Se NAO: continue. Nao avalie threshold nesta wave.
   → Se SIM: prossiga para a pergunta 2.

2. Pontue todos os pain/gain e alivio/criadores de ganho descobertos ate agora,
   sendo 1 o menos relevante e 10 o mais relevante.

3. As descobertas DESTA wave se encaixam como?
   - Quais ficaram abaixo de 3? (irrelevantes)
   - Quais ficaram entre 3 e 7? (moderadas)
   - Quais ficaram acima de 7? (criticas)

4. Com base nessa analise: o incremento a vista pode ser considerado relevante?
   - Se as descobertas novas sao majoritariamente abaixo de 3 e nao ha nada
     acima de 7 que nao tenha sido implementado → o produto esta suficiente.
   - Se ha descobertas acima de 7 nao implementadas ou descobertas moderadas
     que combinadas mudam o produto → ha incremento relevante.

DECISAO:
- Se o incremento NAO e relevante:
  marcar F-XX2..F-XX6 como "skipped" em features.json com motivo
  "threshold: nenhuma descoberta nova justifica incremento"
  Atualizar ranking.json com decision: "stop"
- Se o incremento E relevante:
  continuar normalmente. Atualizar ranking.json com decision: "go"
```

#### Tarefa: Derivar Specs (agent=general)

```
Descricao da feature:
- Ler brainstorming.md da wave atual ({runs_dir}/wave-N/brainstorming.md)
- Ler ranking.json para priorizar descobertas com score mais alto
- Usar skill derive:specs para converter brainstorming em specs tecnicas
- Produzir specs em {runs_dir}/wave-N/specs/
- Specs devem referenciar documentos de infraestrutura e stack do projeto
```

#### Tarefa: Derivar PRPs (agent=general)

```
Descricao da feature:
- Ler specs da wave atual ({runs_dir}/wave-N/specs/)
- Usar skill derive:prps para converter specs em PRPs executaveis
- Produzir PRPs em {runs_dir}/wave-N/prps/
- Cada PRP deve ser auto-contido e implementavel por um agente coder
```

#### Tarefa: Implementar — Vibe (agent=coder)

Esta e a tarefa que aciona o **nivel 2** do harness (micro harness):

```
Descricao da feature:
- Ler os PRPs gerados nesta wave ({runs_dir}/wave-N/prps/)
- Para cada PRP, executar o pipeline completo do harness:
  1. vibe:worktree {prp} — criar worktree isolada para o PRP
  2. vibe:plan {prp} — decompor PRP em features atomicas
  3. vibe:spawn {prp} — spawnar loop de implementacao
  4. Monitorar ate conclusao (loop.json → exit_reason)
  5. vibe:merge {prp} — merge de volta na worktree do macro
- Processar PRPs sequencialmente (merge de um antes de iniciar o proximo)
- Se um PRP falhar (deadlock ou conflito), registrar em progress.txt e continuar com os demais
```

Isso cria a arquitetura de **dois niveis**:

```
repo principal
└── .harness/worktrees/{macro-session}/              ← worktree do macro
    └── .harness/worktrees/{prp-session}/            ← worktree do micro (nivel 2)
```

O macro opera na sua worktree. Cada PRP gera uma worktree de nivel 2 dentro desta.

#### Tarefa: Validar e Corrigir (agent=coder)

```
Descricao da feature:
- Rodar todos os testes do projeto (unit, integration, e2e)
- Verificar que o branding esta aplicado (logo SVG, cores #222e6e/#1dace7/#fca322)
- Se houver falhas: identificar, corrigir, re-testar ate passing
- Se houver testes e2e Playwright: rodar e corrigir falhas
- O agente NAO apenas reporta erros — ele os resolve
```

#### Tarefa: Fechar Wave (agent=general)

```
Descricao da feature:
- Ler ranking acumulado ({runs_dir}/ranking.json)
- Marcar milestone: git tag wave-{N}
- Verificar o campo "decision" do ranking.json:
  - Se decision === "go" → CONTINUAR
  - Se decision === "stop" → PARAR
- Se CONTINUAR:
  - Adicionar features F-XX1..F-XX6 ao features.json (proxima wave)
  - Cada feature segue a anatomia padrao (research, specs, prps, vibe, validate, close)
  - Cada feature com descricao completa seguindo os templates deste experimento
  - Atualizar progress.txt com resumo da wave e plano da proxima
- Se PARAR:
  - Registrar em progress.txt: "Experimento concluido — researcher concluiu que nao ha incremento relevante na wave {N}"
  - O loop.mjs vera tudo como passing/skipped e encerra naturalmente
```

### Criterio de Parada (STOP)

O STOP e decidido em dois momentos:

1. **Pelo researcher (inicio da wave):** apos a reflexao de threshold, se conclui que nao ha incremento relevante, marca F-XX2..F-XX6 como `skipped` e grava `decision: "stop"` no ranking.json. O loop pula direto para a proxima wave ou encerra.

2. **Pelo general (close-wave):** le `decision` do ranking.json. Se `"stop"`, nao templateia proxima wave. O loop encerra.

```
Cenario STOP na wave 3:

  F-013: research (wave 3) → passing
         (reflexao conclui: nenhuma descoberta nova justifica incremento)
         (grava decision: "stop" no ranking.json)
         (marca F-014..F-018 como skipped)
  F-014: gen-specs         → skipped
  F-015: gen-prps          → skipped
  F-016: vibe              → skipped
  F-017: validate          → skipped
  F-018: close wave        → skipped

  → loop.mjs: tudo passing/skipped → exit(0)
```

## Estado e Memoria

### Arquivos de Status (ROOT)

Todos os arquivos de status ficam no ROOT, em `.harness/runs/{session}/`:

```
.harness/runs/{session}/
  config.json       ← configuracao da session (agent profile, worktree path, etc.)
  features.json     ← lista de features (vivo — cresce a cada wave)
  progress.txt      ← log de progresso
  loop.json         ← estado do loop (running/between/exited)
  ranking.json      ← ranking acumulado de dores/ganhos (atualizado a cada wave)
  wave-1/           ← artefatos da wave 1
    brainstorming.md
    specs/
    prps/
  wave-2/           ← artefatos da wave 2
    brainstorming.md
    specs/
    prps/
  runs/             ← output dos agentes (JSONL por feature)
```

### Ranking Acumulado

O `ranking.json` e o artefato central do experimento. Persiste entre waves:

```json
{
  "wave": 3,
  "decision": "go",
  "discoveries": [
    {
      "id": "D-001",
      "type": "pain",
      "description": "Falta de visibilidade do entregador em tempo real",
      "score": 9,
      "discovered_at": 1,
      "last_reclassified_at": 3,
      "implemented_at": 1
    }
  ]
}
```

- **O researcher cria e atualiza** a cada wave (reclassifica scores, adiciona novas descobertas)
- **O general (close-wave) le** para decidir se templateia proxima wave
- **O researcher (inicio da wave) le** para saber o estado acumulado antes de pesquisar

### Git Tags como Milestones

```
wave-1  ← primeira iteracao completa
wave-2  ← segunda iteracao
wave-N  ← ultima iteracao (STOP)
```

Tags permitem navegar o historico por ciclo completo, fazer diff entre waves, e entender a evolucao do produto.

## Por que Zero Scripts Novos

O features.json vivo resolve o macro loop sem script adicional:

- O close-wave adiciona features ao features.json → o loop.mjs ve pendencias novas e continua
- O researcher tem autoridade pra skipar o restante quando threshold e atingido
- O loop.mjs encerra quando tudo e passing/skipped — mecanica ja existente
- O plan gera a wave 1. Dai em diante o loop se auto-alimenta.

## Fluxo Visual

```
┌──────────────────────────────────────────────────────┐
│  MACRO HARNESS — features.json vivo                  │
│                                                      │
│  Wave 1                                              │
│  ┌─────────────────────────────────────────────────┐ │
│  │ F-001 research       → agent=researcher         │ │
│  │ F-002 derive specs   → agent=general            │ │
│  │ F-003 derive prps    → agent=general            │ │
│  │ F-004 vibe           → agent=coder              │ │
│  │   └─ micro harness: worktree → plan → spawn     │ │
│  │      → merge (por PRP)                          │ │
│  │ F-005 validate & fix → agent=coder              │ │
│  │ F-006 close wave     → agent=general            │ │
│  │   git tag wave-1 + templateia wave 2            │ │
│  └─────────────────────────────────────────────────┘ │
│                        ↓                             │
│  Wave 2 (adicionada ao features.json por F-006)      │
│  ┌─────────────────────────────────────────────────┐ │
│  │ F-007 research       → agent=researcher         │ │
│  │   (threshold ok? → se nao: skip F-008..F-012)   │ │
│  │ F-008 derive specs   → agent=general            │ │
│  │ F-009 derive prps    → agent=general            │ │
│  │ F-010 vibe           → agent=coder              │ │
│  │ F-011 validate & fix → agent=coder              │ │
│  │ F-012 close wave     → agent=general            │ │
│  │   git tag wave-2 + templateia wave 3            │ │
│  └─────────────────────────────────────────────────┘ │
│                        ↓                             │
│  Wave N: research conclui STOP                       │
│  → skip restante → loop encerra                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Criterio de Sucesso

O experimento e bem-sucedido quando:

1. O macro harness itera autonomamente do zero ate um produto funcional
2. O threshold funciona como gate eficaz — para quando nao ha mais incremento relevante
3. O ranking acumulado converge — reclassificacoes estabilizam entre waves
4. O app resultante tem branding Chega.la aplicado (logo, cores, identidade visual)
5. Os tres modulos funcionam juntos: lojista cria pedido → central gerencia → motoboy executa → todos sincronizados via SSE em tempo real
