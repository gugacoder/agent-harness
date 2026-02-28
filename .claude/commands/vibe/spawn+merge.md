# Spawn completo + merge automatico (com encadeamento)

Spawna o loop.mjs para desenvolvimento incremental via processos externos e, ao completar todas as features, faz merge automaticamente. Suporta multiplos PRPs em sequencia.

Argumentos: $ARGUMENTS

Formato esperado: `<slug-ou-prp> [slug-ou-prp] [slug-ou-prp] ...`

Exemplos:
- `/kai:vibe:spawn+merge M5-seo-analytics-golive`
- `/kai:vibe:spawn+merge M5-seo-analytics-golive M6-feature-x M7-feature-y`
- `/kai:vibe:spawn+merge .projeto/PRPs/M5-seo-analytics-golive.md`

## Execucao

### Parse dos argumentos

Separe `$ARGUMENTS` por espacos. Cada token e um PRP (path ou slug).
Monte a fila ordenada: `[prp_1, prp_2, ..., prp_n]`

### Loop de PRPs

Para cada `prp` na fila, em ordem:

1. Reporte: "Iniciando PRP {i}/{n}: {prp}"
2. Execute a logica do `/kai:vibe:spawn {prp}` — spawna loop.mjs e monitora ate todas as features serem `passing` ou `skipped`
3. Avalie o resultado:
   - **SPRINT COMPLETA** → execute a logica do `/kai:vibe:merge {prp}` automaticamente
   - **DEADLOCK** → reporte o problema, **PARE A FILA**, e liste os PRPs restantes que nao foram executados
4. Se merge teve **conflito** → reporte os arquivos conflitantes, **PARE A FILA**, e liste os PRPs restantes (usuario precisa resolver conflitos antes de continuar)
5. Se merge foi **limpo** → reporte sucesso e avance para o proximo PRP na fila

### Ao final da fila

Reporte resumo:
- PRPs completados com sucesso: X/N
- PRPs com falha (deadlock ou conflito): listar
- PRPs nao executados (fila interrompida): listar

## Regras

- PARE a fila ao primeiro erro (deadlock ou conflito de merge) — NAO pule para o proximo PRP
- Cada PRP e processado sequencialmente (spawn + merge) antes de iniciar o proximo
- Se apenas 1 argumento, comportamento identico ao simples (spawn + merge)
