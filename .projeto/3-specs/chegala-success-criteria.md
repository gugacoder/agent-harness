# Chega.la - Success Criteria

Criterios de sucesso mensuraveis para o macro harness, organizados por nivel: processo, wave e agente.

---

## Criterios por Nivel

### Nivel: Processo

| ID | Criterio | Metrica | Threshold | Medicao | Consequencia |
|----|----------|---------|-----------|---------|--------------|
| SC001 | Macro harness itera autonomamente do zero ate produto funcional | Waves completadas sem intervencao humana | >= 2 waves completas sem intervencao | Logs de execucao: progress.txt, features.json | Sucesso do experimento |
| SC002 | Threshold funciona como gate eficaz | Researcher para o experimento quando nao ha incremento | decision "stop" ocorre em algum momento (nao roda infinitamente) | Campo `decision` em ranking.json | Se nunca para: falha do mecanismo de threshold |
| SC003 | Ranking acumulado converge | Reclassificacoes estabilizam entre waves | Delta medio de scores entre waves consecutivas < 1.0 nas ultimas 2 waves | Diff de ranking.json entre waves | Convergencia indica maturidade do produto |
| SC004 | App resultante tem branding Chega.la aplicado | Presenca de logo SVG e cores corretas | 100% das telas com logo SVG + cores Primary #222e6e, Secondary #1dace7, Accent #fca322 | Inspecao visual + grep por valores hex | Se ausente: falha critica (branding e requisito do experimento) |
| SC005 | Tres modulos funcionam juntos sincronizados | Fluxo end-to-end operacional | Lojista cria pedido → central gerencia → motoboy executa → SSE em tempo real | Teste e2e do fluxo completo | Sucesso funcional do produto |

---

### Nivel: Wave

| ID | Criterio | Metrica | Threshold | Medicao | Consequencia |
|----|----------|---------|-----------|---------|--------------|
| SC006 | Wave produz todos os artefatos esperados | Artefatos gerados vs esperados por step | 100% (brainstorming.md + ranking.json + specs/ + prps/ + codigo + tag) | File check em `wave-N/` | Se faltam artefatos: retry step faltante |
| SC007 | Nenhum agente excede max_turns | Turns consumidos por feature | <= max_turns do agente (researcher: 100, general: 150, coder: 200) | Log de turns do processo Claude | Se exceder: abort feature, log motivo, prosseguir |
| SC008 | Features da wave completam em sequencia | Todas as features da wave chegam a passing ou skipped | 6/6 features com status final (passing ou skipped) | features.json status check | Se feature fica stuck: abort apos timeout, log em progress.txt |
| SC009 | Testes passam ao final da wave | Suite de testes do projeto | 100% passing apos Step 5 (validate & fix) | Saida do test runner | Se falham apos tentativas de correcao: log, prosseguir com ressalva |
| SC010 | Git tag criado com sucesso | Tag `wave-N` presente | 1 tag por wave completada | `git tag -l "wave-*"` | Se falhar: retry; nao bloqueia proxima wave |

---

### Nivel: Agente

| ID | Criterio | Metrica | Threshold | Medicao | Consequencia |
|----|----------|---------|-----------|---------|--------------|
| SC011 | researcher produz ranking valido | ranking.json parseia sem erros | 0 erros de schema Zod | Parse com RankingSchema | Retry researcher 1x; se falhar, abort wave |
| SC012 | researcher acumula (nao sobrescreve) | Quantidade de discoveries >= wave anterior | discoveries.length >= anterior | Diff de ranking.json | Se sobrescreveu: rollback e retry |
| SC013 | general usa skills existentes | Chamadas a derive:specs e derive:prps | 100% (nunca gera specs/prps manualmente sem skill) | Log de execucao do agente | Se nao usar skills: output pode estar fora do padrao |
| SC014 | general (close-wave) respeita decision | Templateamento condicionado a decision:"go" | Templateia se e somente se decision === "go" | features.json apos close-wave | Se templateia com "stop": features extras indevidas; se nao templateia com "go": experimento para prematuramente |
| SC015 | coder produz commits limpos | Cada feature com commit atomico | 1+ commits por feature, sem arquivos sujos apos | `git status` apos feature | Se sujo: agente deve limpar antes de sair |
| SC016 | coder processa PRPs sequencialmente | Merge de PRP N antes de iniciar PRP N+1 | 0 conflitos por merge fora de ordem | Log de merges | Se fora de ordem: conflitos potenciais |
| SC017 | coder verifica branding | Presenca de assets Chega.la no codigo | Logo SVG referenciado; cores hex presentes | grep por assets e hex codes | Se ausente: coder deve corrigir no Step 5 |

---

## Cenarios de Falha

| Falha | Deteccao | Acao |
|-------|----------|------|
| Researcher produz ranking.json invalido (schema fail) | Validacao Zod pos-step | Retry researcher 1x com prompt corrigido; se falhar, abort wave e log |
| Researcher sobrescreve ranking ao inves de acumular | discoveries.length < wave anterior | Rollback ranking.json via git; retry researcher |
| General nao usa skill derive:specs/prps | Specs/PRPs fora do padrao esperado | Aceitar se output e valido; log warning para proximas waves |
| General templateia proxima wave com decision:"stop" | features.json cresce quando nao deveria | Remover features extras manualmente; log bug |
| Coder falha em PRP (deadlock no micro harness) | loop.json com exit_reason de erro | Log em progress.txt; pular PRP; continuar com demais |
| Coder nao consegue fazer testes passarem | Testes falhando apos multiplas tentativas no Step 5 | Log falhas especificas; prosseguir para close-wave com ressalva |
| Wave inteira falha (nenhum artefato produzido) | wave-N/ vazia ou inexistente | Abort experimento; gerar relatorio de falha |
| Threshold nunca atingido (loop infinito) | Contagem de waves excede limite razoavel (ex: 10) | Abort manual; analisar se threshold esta calibrado |
| Worktree nivel 2 conflita com nivel 1 | Merge falha | Log conflito; resolver manualmente ou pular PRP |
| Todos os PRPs de uma wave falham | Nenhum codigo novo apos Step 4 | Considerar wave como falha parcial; prosseguir para validate (pode nao ter o que validar); close-wave decide |

---

## Rastreabilidade

| ID | Criterio | Protocolo | Agente | Artefato |
|----|----------|-----------|--------|----------|
| SC001 | Iteracao autonoma | PROT001-PROT011 (global) | Todos | features.json (DC002), progress.txt (DC004) |
| SC002 | Threshold eficaz | PROT003 (Gate 1) | researcher (AGT001) | ranking.json (DC003) |
| SC003 | Ranking converge | PROT002 (research) | researcher (AGT001) | ranking.json (DC003) |
| SC004 | Branding aplicado | PROT007 (validate) | coder (AGT003) | Codigo fonte |
| SC005 | Modulos sincronizados | PROT007 (validate) | coder (AGT003) | Codigo fonte, testes e2e |
| SC006 | Artefatos completos | PROT002-PROT008 (wave) | Todos | wave-N/ (DC006, DC007, DC008) |
| SC007 | Max turns respeitado | Todos os steps | Todos os agentes | Logs de processo |
| SC008 | Sequencia completa | PROT002-PROT008 (wave) | Todos | features.json (DC002) |
| SC009 | Testes passing | PROT007 (validate) | coder (AGT003) | Test runner output |
| SC010 | Git tags | PROT008 (close wave) | general (AGT002) | Git tags |
| SC011 | Ranking valido | PROT002 (research) | researcher (AGT001) | ranking.json (DC003) |
| SC012 | Ranking acumula | PROT002 (research) | researcher (AGT001) | ranking.json (DC003) |
| SC013 | Skills usados | PROT004, PROT005 | general (AGT002) | specs/ (DC007), prps/ (DC008) |
| SC014 | Decision respeitada | PROT009 (Gate 2) | general (AGT002) | features.json (DC002) |
| SC015 | Commits limpos | PROT006 (vibe) | coder (AGT003) | Git log |
| SC016 | PRPs sequenciais | PROT006 (vibe) | coder (AGT003) | Merge log |
| SC017 | Branding verificado | PROT007 (validate) | coder (AGT003) | Codigo fonte |
