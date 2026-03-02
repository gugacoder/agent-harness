# Brainstorming — Wave 2: Chega.la

> Pesquisa de mercado para empresas de entregas rapidas urbanas (frotas de motoboys, coleta A → entrega B, atendendo lojistas).
> Wave 2 — Segunda iteracao. Ranking anterior: wave-1 (27 discoveries, avg score 7.7).

---

## Contexto Wave 2

### O que mudou desde a wave 1

**Codigo implementado na wave 1:**
O nucleo operacional minimo do Chega.la foi construido e esta funcional:

| Modulo | Status | O que funciona |
|---|---|---|
| Central da Empresa | Implementado | Dashboard com metricas basicas, mapa real-time de motoboys, lista de pedidos ativos, gestao de motoboys e lojistas, atribuicao manual de entregas |
| App do Lojista | Implementado | Criar pedido em poucos cliques, acompanhar status em tempo real, ver motoboy no mapa, historico de pedidos |
| App do Motoboy | Implementado | Receber/aceitar/recusar entregas via SSE, atualizar status (coletou, a caminho, entregou), toggle disponibilidade, historico |
| Backbone SSE | Implementado | 3 canais (company, courier, order), heartbeat 30s, reconexao automatica, auth JWT |
| Autenticacao | Implementado | Supabase GoTrue, JWT, convite por email, 3 perfis (operator, shop, courier), multi-tenancy |
| PWA | Implementado | Instalavel nos 3 modulos |

**Discoveries da wave-1 efetivamente resolvidas pelo codigo:**

| Discovery | Score | Status |
|---|---|---|
| D-001 (Gargalo WhatsApp) | 10 | ✅ Resolvido — ciclo pedido funciona sem WhatsApp |
| G-001 (Painel centralizado) | 10 | ✅ Resolvido — dashboard com mapa, pedidos, motoboys |
| D-002 (Equipes inchadas) | 9 | ✅ Resolvido — lojista self-service, zero intermediario |
| D-003 (Sem visibilidade motoboys) | 9 | ✅ Resolvido — GPS real-time via SSE, mapa na central |
| G-002 (Escalar sem contratar) | 9 | ✅ Resolvido — lojista cria pedido, motoboy recebe notif |
| G-006 (Solicitar em segundos) | 9 | ✅ Resolvido — app do lojista com formulario rapido |
| D-008 (Escalar sem inchar) | 8 | ✅ Resolvido — automacao do ciclo completo |
| D-010 (Sem rastreamento lojista) | 8 | ✅ Resolvido — lojista ve motoboy no mapa |
| G-007 (Rastreamento real-time) | 8 | ✅ Resolvido — SSE + Leaflet map |
| D-006 (Erros digitacao) | 7 | ✅ Resolvido — campos estruturados com validacao Zod |
| D-011 (Processo lento solicitar) | 7 | ✅ Resolvido — app lojista substituiu WhatsApp |
| D-013 (Comunicacao fragmentada) | 6 | ✅ Resolvido — canal dedicado via SSE |
| D-015 (Entregas perdidas WhatsApp) | 7 | ✅ Resolvido — notificacao SSE para motoboy |
| G-010 (Notificacao entregas) | 7 | ✅ Resolvido — SSE notifica motoboy |
| G-011 (Compartilhar localizacao) | 6 | ✅ Resolvido — GPS automatico no app motoboy |

**Discoveries da wave-1 NAO implementadas (gap atual):**

| Discovery | Score | Gap |
|---|---|---|
| D-004 (Fechamento caixa) | 8 | Zero modulo financeiro |
| D-014 (Transparencia pgto motoboy) | 8 | Motoboy nao ve quanto ganhou |
| G-003 (Fechamento financeiro auto) | 8 | Nenhum calculo de repasse |
| G-004 (Dados e metricas) | 8 | Apenas contadores basicos (total, em andamento, concluidos) |
| G-009 (Extrato motoboy) | 8 | Sem dashboard financeiro no app motoboy |
| D-012 (Cobranças erradas lojista) | 7 | Sem faturamento |
| G-008 (Historico faturamento lojista) | 7 | Sem fatura/extrato |
| D-005 (Rotas mal planejadas) | 7 | Sem roteirizacao |
| G-005 (IA progressiva) | 7 | Sem IA |
| D-009 (Operacao para) | 6 | Parcialmente resolvido — sistema existe, mas conhecimento operacional ainda depende de pessoas |
| D-016 (Sem roteirizacao) | 5 | Sem sugestao de rota |

### Mercado em 2026

- **Mercado last mile Brasil**: USD 5.0 bilhoes (2025), projecao USD 18.0 bilhoes ate 2034 (CAGR 15.3%)
- **Regulamentacao**: adicional de periculosidade de 30% para motoboys entra em vigor em abril 2026 (Portaria MTE 2.021/2025). Impacto direto no custo operacional das empresas de entregas.
- **Tendencia de mercado**: prova de entrega digital (foto + assinatura + GPS) e padrao em 2026. Concorrentes como Entregas Expressas, SyLog, Bluemap ja oferecem.
- **Food service Brasil**: R$ 455 bilhoes em 2024, delivery crescendo acima de 7%/ano.
- **Concorrentes evoluiram**: Entregas Expressas com 250+ empresas, tabela de precos customizavel (por km, bairro, taxa chuva), integracao com 20+ plataformas, app publicavel com marca propria.

Fontes:
- [Technavio — Brazil Last Mile Delivery Market 2025-2029](https://www.technavio.com/report/last-mile-delivery-market-in-brazil-industry-analysis)
- [IMARC — Brazil Last Mile Delivery Market 2034](https://www.imarcgroup.com/brazil-last-mile-delivery-market)
- [A Tarde — Adicional 30% para motoboys vira lei](https://atarde.com.br/economia/adicional-de-30-para-motoboys-vira-lei-preco-do-delivery-vai-subir-1381000)
- [Controle na Mao — 7 maiores problemas com motoboys](https://controlenamao.com.br/blog/maiores-problemas-com-motoboys-no-delivery-e-como-resolver/)
- [Vuupt — 5 problemas frequentes com motoboys](https://www.vuupt.com/post/problemas-com-motoboys-no-servico-de-delivery/)
- [Entregas Expressas](https://entregasexpressas.com.br)
- [SyLog — GR Express](https://www.sylog.com.br/gr-exp-gestao-entregas-rapidas)
- [Expresso Delivery — Funcionalidades](https://expressodelivery.com.br/funcionalidades)

---

## Novas Dores Identificadas (Wave 2)

### Dores do Empresario

**D-017 | Sem comprovante de entrega (Proof of Delivery)** (Score: 8)
O motoboy marca "entregue" no app mas nao ha evidencia. Se o cliente final alega que nao recebeu, a empresa nao tem como provar. Concorrentes (Entregas Expressas, SyLog, Bluemap) ja oferecem foto + assinatura digital + GPS no momento da entrega. Em 2026, POD e expectativa padrao do mercado — nao ter e uma desvantagem competitiva clara.
- Fonte: [SyLog — baixas com foto e assinatura](https://www.sylog.com.br/gr-exp-gestao-entregas-rapidas), [Vuupt — problemas com motoboys](https://www.vuupt.com/post/problemas-com-motoboys-no-servico-de-delivery/), [Upper — Proof of Delivery Apps 2026](https://www.upperinc.com/blog/proof-of-delivery-apps/)

**D-018 | Sem tabela de precos configuravel** (Score: 8)
A empresa de entregas precisa cobrar lojistas por cada corrida, mas o Chega.la nao tem nenhum mecanismo de precificacao. Na vida real, empresas cobram por km, por bairro, por faixa de distancia, taxa fixa, ou hibrido. Sem isso, o app nao pode gerar cobrancas — e o lojista continua recebendo faturas manuais.
- Fonte: [55content — Como cobrar pelas entregas](https://55content.com.br/machine-conecta/como-cobrar-pelas-entregas/), [Controle na Mao — Taxa de entrega por KM](https://controlenamao.com.br/blog/como-calcular-a-taxa-de-entrega-de-delivery-por-km/), [Entregas Expressas — tabela customizavel](https://entregasexpressas.com.br)

**D-019 | Impacto regulatorio — periculosidade 30% (abril 2026)** (Score: 7)
A Portaria MTE 2.021/2025 garante adicional de periculosidade de 30% para motoboys com vinculo. Empresas precisam recalcular custos operacionais. O app poderia ajudar a documentar tipo de vinculo (CLT vs autonomo), calcular custos e gerar relatorios de conformidade. Quem nao se adapta corre risco juridico.
- Fonte: [A Tarde — Adicional 30% vira lei](https://atarde.com.br/economia/adicional-de-30-para-motoboys-vira-lei-preco-do-delivery-vai-subir-1381000), [Jusbrasil — Portaria 2.021/2025](https://www.jusbrasil.com.br/artigos/quem-trabalha-de-moto-tem-direito-ao-adicional-de-periculosidade-em-2026-entenda-a-portaria-2021-2025/5600941950)

**D-020 | Alta rotatividade de motoboys** (Score: 7)
Motoboys insatisfeitos migram para concorrentes ou apps sob demanda (Loggi, 99). Causas: desorganizacao operacional, falta de transparencia no pagamento, disputas sobre valores. Uma vez que o motoboy sai, a empresa perde experiencia e confiabilidade. Software que da transparencia, extrato claro e tratamento justo reduz rotatividade.
- Fonte: [Vuupt — problemas com motoboys](https://www.vuupt.com/post/problemas-com-motoboys-no-servico-de-delivery/), [Controle na Mao — problemas com motoboys](https://controlenamao.com.br/blog/maiores-problemas-com-motoboys-no-delivery-e-como-resolver/)

### Dores do Lojista

**D-021 | Sem estimativa de tempo de entrega** (Score: 7)
Quando o lojista cria um pedido, nao recebe nenhuma previsao de quando o motoboy chegara para coleta ou quando entregara. O lojista nao consegue dar respostas ao cliente final ("seu pedido chega em X minutos"). Concorrentes como iFood ja condicionaram os lojistas a esperar ETAs.
- Fonte: [Controle na Mao — entregas demoradas](https://controlenamao.com.br/blog/maiores-problemas-com-motoboys-no-delivery-e-como-resolver/)

**D-022 | Sem notificacao para o cliente final** (Score: 6)
O lojista muitas vezes precisa repassar status da entrega manualmente ao cliente final (via WhatsApp). O app do Chega.la notifica o lojista, mas nao o consumidor. Concorrentes oferecem link de rastreamento que o lojista pode compartilhar com o cliente.
- Fonte: [Expresso Delivery — notificacoes](https://expressodelivery.com.br/funcionalidades), modelo iFood/Rappi

### Dores do Motoboy

**D-023 | Sem comprovante de que entregou** (Score: 7)
O motoboy marca "entregue" mas nao tem como provar se surgir disputa. Se o cliente final diz que nao recebeu, a empresa cobra o motoboy. Um sistema de foto + assinatura protege o motoboy tambem.
- Fonte: [SyLog — foto e assinatura](https://www.sylog.com.br/gr-exp-gestao-entregas-rapidas), [Track-POD — Proof of Delivery](https://www.track-pod.com/)

---

## Novos Ganhos Identificados (Wave 2)

### Ganhos do Empresario

**G-012 | Tabela de frete configuravel** (Score: 8)
Configurar precos por km, por bairro, faixa de distancia, taxa fixa, ou hibrido. Permitir tabelas diferentes por lojista, tipo de veiculo, horario ou dia. Taxa de chuva (surcharge). O sistema calcula automaticamente o valor de cada entrega com base na tabela ativa.
- Fonte: [55content — Como cobrar](https://55content.com.br/machine-conecta/como-cobrar-pelas-entregas/), [Entregas Expressas — tabela customizavel](https://entregasexpressas.com.br)

**G-013 | Comprovante digital de entrega (POD)** (Score: 8)
Motoboy tira foto + coleta assinatura digital no celular no momento da entrega. Dados salvos com GPS + timestamp. Disponivel no historico para empresa, lojista e motoboy consultarem. Resolve disputas de "nao recebi".
- Fonte: [Track-POD](https://www.track-pod.com/), [Locate2u — Proof of Delivery](https://www.locate2u.com/proof-of-delivery-software/), [SyLog](https://www.sylog.com.br/gr-exp-gestao-entregas-rapidas)

**G-014 | Faturamento automatizado para lojistas** (Score: 8)
Gerar faturas periodicas (diaria, semanal, mensal) com base nas entregas realizadas. Detalhar: data, pedido, origem, destino, distancia, valor. Lojista ve fatura no app. Empresa exporta para contabilidade. Elimina cobranca manual.
- Fonte: [SyLog — faturamento com boletos](https://www.sylog.com.br/gr-exp-gestao-entregas-rapidas), [GestaoClick — contas a receber](https://gestaoclick.com.br/programa-para-empresa-de-moto-boy/)

**G-015 | Dispatch inteligente** (Score: 7)
Em vez do operador escolher manualmente qual motoboy atribuir, o sistema sugere (ou auto-atribui) o motoboy mais proximo/disponivel. Reduz tempo de resposta e distribui entregas de forma justa. Nivel avancado: agrupar pedidos para mesmo bairro no mesmo motoboy.
- Fonte: [Foody Delivery — despacho automatico](https://foodydelivery.com/), [Entregas Expressas — agrupamento de rotas](https://entregasexpressas.com.br)

### Ganhos do Lojista

**G-016 | Link de rastreamento para cliente final** (Score: 6)
O lojista recebe um link compartilhavel que mostra a posicao do motoboy em tempo real. Pode enviar ao cliente final via WhatsApp. O cliente ve o mapa sem precisar instalar nada. Gera confianca e profissionalismo.
- Fonte: modelo iFood/Rappi, [Expresso Delivery](https://expressodelivery.com.br/funcionalidades)

### Ganhos do Motoboy

**G-017 | Protecao por comprovante digital** (Score: 7)
Foto + assinatura no momento da entrega protege o motoboy contra acusacoes falsas de "nao entregou". O motoboy tem registro permanente de cada entrega realizada com sucesso.
- Fonte: [Track-POD](https://www.track-pod.com/), [SyLog](https://www.sylog.com.br/gr-exp-gestao-entregas-rapidas)

---

## Reclassificacao de Discoveries Wave-1

### Discoveries que SUBIRAM de score (mais urgentes dado o contexto atual)

| ID | Score anterior | Score wave-2 | Justificativa |
|---|---|---|---|
| D-004 (Fechamento caixa) | 8 | 9 | Core gap. App funciona mas sem financeiro nao gera receita. Empresarios precisam disso no dia 1 de uso real. |
| D-014 (Transparencia pgto motoboy) | 8 | 9 | Regulamentacao de periculosidade (abril 2026) torna transparencia financeira ainda mais critica. Motoboy insatisfeito = rotatividade alta. |
| G-003 (Fechamento financeiro auto) | 8 | 9 | Com o ciclo de pedidos funcionando, o proximo gargalo e o financeiro. Sem ele, a empresa continua usando planilha. |
| G-009 (Extrato motoboy) | 8 | 9 | Diretamente ligado a retencao de motoboys. Com regulamentacao nova, motoboy vai exigir mais transparencia. |
| G-004 (Dados e metricas) | 8 | 8 | Mantem. Dashboard basico existe, mas empresario precisa de analytics para decisoes (performance por motoboy, bairros, horarios). |
| D-012 (Cobranças erradas lojista) | 7 | 8 | Sem faturamento automatico, lojista continua recebendo cobranças manuais imprecisas. Corroi confianca. |
| G-008 (Historico faturamento lojista) | 7 | 8 | Lojista precisa ver quanto deve e conferir. Sem isso, nao confia e troca de empresa. |

### Discoveries que DESCERAM de score (menos urgentes ou parcialmente resolvidas)

| ID | Score anterior | Score wave-2 | Justificativa |
|---|---|---|---|
| D-009 (Operacao para) | 6 | 4 | O sistema em si ja resolve boa parte — conhecimento operacional esta no software, nao na cabeca de uma pessoa. |
| D-016 (Sem roteirizacao) | 5 | 4 | Nice-to-have. Motoboys experientes conhecem a cidade. Google Maps/Waze complementam. |

### Discoveries que MANTIVERAM score

| ID | Score | Nota |
|---|---|---|
| D-005 (Rotas duplicadas) | 7 | Relevante mas depende de dispatch inteligente (G-015). Implementar junto. |
| G-005 (IA progressiva) | 7 | Diferencial futuro. Depende de ter dados (financeiro, metricas) para fazer sentido. |

---

## Alivios — Como o Chega.la pode aliviar as novas dores

| ID | Dor que alivia | Como alivia |
|---|---|---|
| A-011 | D-017 + D-023 (Sem comprovante) | POD no app motoboy: foto + assinatura + GPS + timestamp. Salvo na delivery e acessivel a todos. |
| A-012 | D-018 (Sem tabela precos) | Modulo de precificacao: empresa configura tabela por km/bairro/faixa. Sistema calcula valor automatico. |
| A-013 | D-019 (Periculosidade) | Campo tipo_vinculo no cadastro do motoboy (CLT/autonomo). Relatorios de custo com adicional. |
| A-014 | D-020 (Alta rotatividade) | Extrato claro (G-009), dispatch justo (G-015), comprovante (G-013). Motoboy satisfeito = leal. |
| A-015 | D-021 (Sem ETA) | Calcular ETA baseado em distancia media e velocidade historica. Exibir no app lojista. |
| A-016 | D-022 (Sem notif cliente final) | Link de rastreamento compartilhavel (G-016). Lojista envia ao cliente. |

---

## Criadores de Ganho — Como o Chega.la cria valor positivo

| ID | Ganho que potencializa | Como cria |
|---|---|---|
| CG-009 | G-012 (Tabela de frete) | Configurador visual: arrastar faixas de km, definir precos por bairro no mapa, toggle taxa de chuva. |
| CG-010 | G-013 (POD) | Fluxo no app motoboy: "Entregar" → camera + canvas assinatura → salvar com coordenadas. Consulta no historico. |
| CG-011 | G-014 (Faturamento lojista) | Geracao automatica de extrato: periodo, lista entregas, subtotais, total. PDF exportavel. Status pgto (pendente/pago). |
| CG-012 | G-015 (Dispatch inteligente) | Sugestao automatica do motoboy mais proximo (via ultimo GPS). Operador confirma ou ajusta. |
| CG-013 | G-016 (Link rastreamento) | URL publica com mapa read-only + status da entrega. Sem login necessario. |

---

## Analise de Concorrentes — Atualizacao Wave 2

### Entregas Expressas (atualizado)

Continua sendo o concorrente mais direto. Evolucoes relevantes:
- **250+ empresas ativas, 5M+ pedidos processados**
- **Tabela de precos totalmente customizavel**: por km, faixas de km, por bairro, valor fixo. Tabelas diferenciadas por cliente, veiculo, tipo de servico, dia de chuva.
- **POD**: fotos e assinatura na entrega
- **Integracoes**: 20+ plataformas (iFood, Ze Delivery, Anota AI, etc.)
- **App publicavel com marca propria** nas lojas (Premium+)
- **Preco**: R$ 174-2.145/mes

**Gap do Chega.la vs Entregas Expressas**: O nucleo operacional do Chega.la agora compete (pedidos, rastreamento, SSE). Mas falta: financeiro, POD, tabela de precos, integracoes, app nativo. O diferencial do Chega.la (IA progressiva) ainda nao foi implementado.

### Novos concorrentes identificados

| Concorrente | Funcionalidades relevantes | Gap vs Chega.la |
|---|---|---|
| **SyLog GR Express** | POD (foto + assinatura), faturamento com boletos e NF, rastreamento, despacho | Financeiro completo, POD |
| **Mapp Sistemas** | Pagina do cliente, controle de caixa, rastreamento | Pagina self-service similar ao Chega.la, foco financeiro |
| **GestaoClick** | Contas a pagar/receber, fluxo de caixa, relatorios | ERP-like, forte em financeiro |
| **Expresso Delivery** | Programa de fidelidade, NFC-e, TEF, notificacoes push/email | Marketing tools, fiscal |
| **Bluemap** | Assinatura + foto + geoloc na entrega, sistema motofrete | POD nativo |

### Posicionamento atualizado do Chega.la

O Chega.la tem vantagem em:
1. **Real-time via SSE** — experiencia de acompanhamento superior (Leaflet + SSE nativo)
2. **Tres modulos sincronizados** — concorrentes geralmente sao mais fracos no app do lojista
3. **IA progressiva (roadmap)** — nenhum concorrente oferece
4. **Stack moderna** — Hono + Drizzle + Supabase + Vite + React. Mais agil que stacks legadas.

O Chega.la precisa urgentemente:
1. **Modulo financeiro** — tabela de precos + fechamento + faturamento + extrato motoboy
2. **POD** — foto + assinatura na entrega
3. **Analytics** — metricas para gestao

---

## Priorizacao — O que construir na Wave 2

### Tier 1 — Critico (Score 8-9): Deve estar na Wave 2

| Prioridade | O que | Score | Justificativa |
|---|---|---|---|
| 1 | **Modulo financeiro basico**: tabela de precos (G-012) + calculo automatico por entrega + fechamento por motoboy (G-003/D-004) + extrato motoboy (G-009/D-014) | 9 | Gap #1. Sem financeiro, o app nao gera valor real para o empresario no dia a dia. Todos os concorrentes tem. |
| 2 | **Faturamento do lojista**: extrato de entregas (G-014/D-012) + historico com valores (G-008) | 8 | Gap #2. Lojista precisa saber quanto deve. Sem isso, cobranca continua manual. |
| 3 | **Proof of Delivery**: foto + assinatura digital no app motoboy (G-013/D-017/D-023) | 8 | Gap #3. Padrao de mercado 2026. Protege empresa, lojista e motoboy. |
| 4 | **Dashboard analitico**: metricas por periodo, performance por motoboy, volume por bairro (G-004) | 8 | Gap #4. Empresario profissionalizado precisa de dados para decisoes. |

### Tier 2 — Importante (Score 6-7): Waves seguintes

- Dispatch inteligente (G-015) — sugestao automatica de motoboy
- ETA para lojista (D-021) — estimativa de tempo
- Link rastreamento cliente final (G-016/D-022)
- Conformidade regulatoria periculosidade (D-019)
- Reducao rotatividade motoboys (D-020) — resolvido parcialmente por financeiro + POD

### Tier 3 — Diferencial (Score 4-7): Waves futuras

- IA Nivel 1: Acompanhamento inteligente (G-005)
- Agrupamento de rotas (D-005)
- Roteirizacao motoboy (D-016)

---

## Fontes da Pesquisa — Wave 2

### Mercado e tendencias
- [Technavio — Brazil Last Mile Delivery Market 2025-2029](https://www.technavio.com/report/last-mile-delivery-market-in-brazil-industry-analysis)
- [IMARC — Brazil Last Mile Delivery Market 2034](https://www.imarcgroup.com/brazil-last-mile-delivery-market)
- [Research and Markets — Last Mile Delivery Market Report 2026](https://www.researchandmarkets.com/reports/5980378/last-mile-delivery-market-report)

### Regulamentacao
- [A Tarde — Adicional 30% para motoboys vira lei](https://atarde.com.br/economia/adicional-de-30-para-motoboys-vira-lei-preco-do-delivery-vai-subir-1381000)
- [Diario de Pernambuco — Lei motoboys e entregadores](https://diariodepernambuco.com.br/dpmais/lei-aprovada-muda-regras-para-motoboys-e-entregadores-nesta-regiao-do-brasil/)
- [Jusbrasil — Portaria 2.021/2025 periculosidade](https://www.jusbrasil.com.br/artigos/quem-trabalha-de-moto-tem-direito-ao-adicional-de-periculosidade-em-2026-entenda-a-portaria-2021-2025/5600941950)

### Dores e problemas
- [Controle na Mao — 7 maiores problemas com motoboys](https://controlenamao.com.br/blog/maiores-problemas-com-motoboys-no-delivery-e-como-resolver/)
- [Vuupt — 5 problemas frequentes com motoboys](https://www.vuupt.com/post/problemas-com-motoboys-no-servico-de-delivery/)
- [55content — Como cobrar pelas entregas](https://55content.com.br/machine-conecta/como-cobrar-pelas-entregas/)
- [Controle na Mao — Taxa de entrega por KM](https://controlenamao.com.br/blog/como-calcular-a-taxa-de-entrega-de-delivery-por-km/)

### Concorrentes
- [Entregas Expressas](https://entregasexpressas.com.br)
- [SyLog — GR Express](https://www.sylog.com.br/gr-exp-gestao-entregas-rapidas)
- [Expresso Delivery — Funcionalidades](https://expressodelivery.com.br/funcionalidades)
- [Mapp Sistemas](https://mappsistemas.com.br/paginas/servicos/)
- [GestaoClick](https://gestaoclick.com.br/programa-para-empresa-de-moto-boy/)
- [Bluemap — Sistema Motofrete](http://www.sistemamotofrete.com.br/)

### Proof of Delivery
- [Upper — Proof of Delivery Apps 2026](https://www.upperinc.com/blog/proof-of-delivery-apps/)
- [Track-POD](https://www.track-pod.com/)
- [Locate2u — Proof of Delivery Software](https://www.locate2u.com/proof-of-delivery-software/)
- [Shipsy — Proof of Delivery 2026](https://shipsy.io/blogs/proof-of-delivery/)

### Documentos internos
- Documento Comercial Chega.la
- Landing Page Chega.la
- Concorrente Entregas Expressas (analise wave-1)
- Objetivo Norte
- PRP-experimento-chegala.md
- Wave-1 ranking.json (27 discoveries)
- Wave-1 specs (requirements, user stories, design, ER, UI guide)
- Codigo fonte do app (analise direta do codebase)
