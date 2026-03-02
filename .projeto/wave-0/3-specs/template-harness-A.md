# Template Harness A — Research + Decision

## Quando usar

Este template e aplicado no inicio de cada wave. Ele pesquisa, decide, gera specs e PRPs do app, e dispara o Harness B.

## Quem dispara

- Wave 1: o operador humano manualmente
- Wave 2+: a ultima feature do Harness B da wave anterior

## Como disparar

```bash
vibe:worktree .projeto/wave-0/4-prps/PRP.md --session wave-{N}-research
vibe:plan     # decompoem o PRP nas features abaixo
vibe:spawn    # inicia loop.mjs
```

## Features que o vibe:plan DEVE gerar

### F-001 — Research dores/ganhos (agent=researcher)

**O nicho:** empresas de entregas rapidas urbanas. Sao empresas que operam frotas de motoboys fazendo coleta ponto A → entrega ponto B, atendendo lojistas (restaurantes, farmacias, pet shops, lojas) numa cidade ou regiao. O cliente da empresa NAO e o consumidor final — e o **lojista** que contrata o servico de entrega e o **empresario** que opera a frota. Hoje essas empresas operam por WhatsApp: lojista manda pedido no grupo, operador despacha motoboy por mensagem, motoboy confirma por audio. O software substitui esse caos por uma operacao estruturada.

**O objetivo do research:** identificar dores e ganhos desse nicho para planejar o proximo incremento do software. O app esta sendo construido iterativamente — cada wave adiciona funcionalidades reais. Pense: "o que falta no app AGORA para atender melhor esse empresario e seus lojistas/motoboys?"

1. Ler TODOS os documentos de referencia listados no PRP
2. Ler ranking acumulado da wave anterior (`.projeto/wave-{N-1}/ranking.json`), se existir
3. Pesquisar na internet: dores e ganhos de empresarios de entregas rapidas urbanas no Brasil
   - Como operam hoje (WhatsApp, planilha, sistemas precarios)
   - O que concorrentes oferecem (Entregas Expressas, 99Entregas, MachDelivery)
   - O que lojistas reclamam dos servicos de entrega
   - O que motoboys precisam para trabalhar melhor
4. Cruzar com o que ja existe no app (se wave > 1, ler codigo atual e listar funcionalidades ja implementadas)
5. Produzir `.projeto/wave-{N}/research/brainstorming.md`:
   - Dores identificadas (com evidencia) — do empresario, do lojista, do motoboy
   - Ganhos desejados por cada perfil
   - Alivios propostos (como o app resolve cada dor)
   - Criadores de ganho (como o app maximiza cada ganho)
   - Priorizacao: o que agrega mais valor AGORA dado o estado atual do app
6. Produzir `.projeto/wave-{N}/research/pain-gain.md` com tabela:
   `| ID | Tipo | Perfil (empresario/lojista/motoboy) | Descricao | Score (1-10) | Wave descoberta | Implementado? |`

### F-002 — Decision: continuar ou parar (agent=researcher)

REFLEXAO DE THRESHOLD:

1. Waves ate o momento sao suficientes para avaliar threshold?
   - Primeiras waves: NAO → decision "go", nao avaliar threshold
   - Se SIM: prosseguir

2. Pontuar todos os pain/gain (1-10)

3. Descobertas desta wave: abaixo de 3? entre 3-7? acima de 7?

4. Incremento relevante?
   - Majoritariamente abaixo de 3 e nada acima de 7 nao implementado → STOP
   - Descobertas acima de 7 nao implementadas → GO

Gravar `.projeto/wave-{N}/ranking.json`:
```json
{
  "wave": 1,
  "decision": "go",
  "discoveries": [
    { "id": "D-001", "type": "pain", "description": "...", "score": 9, "discovered_at": 1, "last_reclassified_at": 1, "implemented_at": null }
  ]
}
```

Se decision = "stop": marcar TODAS as features restantes como `skipped`. Experimento encerrado.

### F-003 — Derive specs (agent=general)

1. Ler `.projeto/wave-{N}/research/brainstorming.md`
2. Ler ranking.json — priorizar score mais alto
3. Ler docs de infraestrutura e stack
4. Executar skill `derive:specs`
5. Produzir specs em `.projeto/wave-{N}/specs/`
6. Validar e iterar ate correto

### F-004 — Derive PRPs (agent=general)

1. Ler specs de `.projeto/wave-{N}/specs/`
2. Ler brainstorming e ranking.json
3. Executar skill `derive:prps`
4. Produzir PRPs em `.projeto/wave-{N}/prps/`
5. IMPORTANTE: PRPs sao sobre o APP (tabelas, APIs, telas) — nunca sobre o harness
6. Cada PRP auto-contido e implementavel por agente coder
7. Validar e iterar ate correto

### F-005 — Passar bastao ao Harness B (agent=general)

1. Listar PRPs gerados em `.projeto/wave-{N}/prps/`
2. Criar um PRP extra em `.projeto/wave-{N}/prps/PRP-wave-{N}-close.md` com o conteudo descrito no Template Harness B, secao "PRP de encadeamento"
3. Para cada PRP (incluindo o PRP-close):
   - `vibe:worktree {prp}`
   - `vibe:plan {prp}`
4. Disparar `vibe:spawn` do primeiro PRP (ou `vibe:spawn+merge` para encadeamento automatico)
5. Marcar esta feature como passing — Harness A encerrado, Harness B assume
