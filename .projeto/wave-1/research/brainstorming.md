# Brainstorming — Wave 1: Chega.la

> Pesquisa de mercado para empresas de entregas rapidas urbanas (frotas de motoboys, coleta A → entrega B, atendendo lojistas).
> Wave 1 — Primeira iteracao. Sem ranking anterior.

---

## Contexto do Nicho

O Chega.la atende empresas que operam frotas de motoboys fazendo coleta ponto A → entrega ponto B, servindo lojistas (restaurantes, farmacias, pet shops, lojas). O cliente da empresa NAO e o consumidor final — sao dois perfis B2B:

1. **Empresario** — dono/gestor da empresa de entregas rapidas
2. **Lojista** — cliente da empresa de entregas (restaurante, farmacia, pet shop, loja)
3. **Motoboy** — entregador que executa as corridas

Hoje a maioria opera por WhatsApp + planilhas Excel. O mercado de last mile no Brasil deve crescer mais de US$ 5 bilhoes ate 2029, com e-commerce ampliando participacao (+10% faturamento estimado para 2026).

---

## Dores

### Dores do Empresario (dono da empresa de entregas)

**D-001 | Gargalo do WhatsApp na operacao** (Score: 10)
O WhatsApp nao e ferramenta de gestao logistica. Quando o volume de entregas cresce (acima de 2.000-3.000/mes), o processo se torna insustentavel. Atendentes precisam ler mensagens, digitar dados (cliente, coleta, entrega, valor) em planilhas e avisar o motoboy manualmente. Mensagens se perdem em grupos lotados.
- Fonte: [Foody Delivery — O problema do WhatsApp nas empresas de entregas](https://foodydelivery.com/blog/o-problema-do-whatsapp-nas-empresas-de-entregas/)

**D-002 | Equipes inchadas para tarefas repetitivas** (Score: 9)
Muitas empresas precisam de 3+ pessoas apenas para digitar pedidos, copiar enderecos e fazer fechamento de caixa dos motoboys. Cada tarefa repetida e tempo e dinheiro jogados fora. Case real: empresa com 20 anos de mercado mantinha 3 pessoas so para digitar pedidos e fechar planilhas.
- Fonte: Documento comercial Chega.la (caso Agiliza)

**D-003 | Sem visibilidade em tempo real dos motoboys** (Score: 9)
Via WhatsApp nao e possivel visualizar motoboys em operacao. Se um motoboy se acidenta ou nao consegue entregar, a empresa so descobre quando o cliente reclama. Zero rastreamento, zero controle de posicao.
- Fonte: [Foody Delivery](https://foodydelivery.com/blog/o-problema-do-whatsapp-nas-empresas-de-entregas/)

**D-004 | Fechamento de caixa manual e propenso a erros** (Score: 8)
O fechamento financeiro dos motoboys (quanto cada um fez, quanto deve receber, cobranças em dinheiro vs PIX) e feito em planilhas ou cadernos. Erros de lancamento sao frequentes — valores na conta errada, recebimentos nao registrados. Isso gera conflitos com motoboys e prejuizo financeiro.
- Fonte: [Foody Delivery — Gestao de Entregas](https://foodydelivery.com/blog/sistema-gestao-entregas-fim-planilhas/)

**D-005 | Rotas mal planejadas e duplicidade de percursos** (Score: 7)
Sem roteirizacao automatica, a empresa manda dois motoboys para o mesmo bairro entregar pedidos vizinhos. Gasto duplo de combustivel, equipe ociosa, tempo desperdicado. A empresa nao tem dados para otimizar.
- Fonte: [Foody Delivery](https://foodydelivery.com/blog/sistema-gestao-entregas-fim-planilhas/)

**D-006 | Erros de digitacao geram entregas falhas** (Score: 7)
Um endereco copiado errado no WhatsApp gera entrega falha. O custo de ir, voltar e ir novamente consome todo o lucro da corrida. Em escala, isso corroe a margem do negocio.
- Fonte: [Foody Delivery](https://foodydelivery.com/blog/o-problema-do-whatsapp-nas-empresas-de-entregas/)

**D-007 | Sem metricas e dados de gestao** (Score: 8)
O WhatsApp nao gera dados: quantas entregas cada motoboy fez, tempo medio, taxa de falha, horarios de pico, bairros mais atendidos. Sem dados, nao ha gestao — o empresario toma decisoes no escuro.
- Fonte: [Foody Delivery](https://foodydelivery.com/blog/o-problema-do-whatsapp-nas-empresas-de-entregas/)

**D-008 | Dificuldade de escalar sem inchar a equipe** (Score: 8)
O limite de escala humana e real: uma pessoa nao consegue copiar enderecos para 50 motoboys ao mesmo tempo sem errar. Para crescer, a empresa precisa contratar mais atendentes, aumentando custo fixo.
- Fonte: [Foody Delivery](https://foodydelivery.com/blog/sistema-gestao-entregas-fim-planilhas/)

**D-009 | Operacao para se um funcionario-chave sai** (Score: 6)
Se o funcionario principal (quem conhece os clientes, enderecos, motoboys) sai ou falta, a operacao paralisa. Nao ha sistema — o conhecimento esta na cabeca de uma pessoa.
- Fonte: Documento Landing Page Chega.la

### Dores do Lojista (cliente da empresa de entregas)

**D-010 | Falta de rastreamento do pedido** (Score: 8)
O lojista manda a mercadoria com o motoboy e nao sabe onde esta ate o cliente final reclamar ou o motoboy avisar pelo WhatsApp. Sem visibilidade, nao consegue dar respostas ao cliente final.
- Fonte: [Controle na Mao — Problemas com motoboys](https://controlenamao.com.br/blog/maiores-problemas-com-motoboys-no-delivery-e-como-resolver/)

**D-011 | Processo lento para solicitar entregas** (Score: 7)
Para pedir um motoboy, o lojista precisa: abrir WhatsApp, digitar dados (endereco coleta, endereco entrega, valor, observacoes), esperar confirmacao, perguntar "ja saiu?". Em horarios de pico, a resposta demora e o lojista perde vendas.
- Fonte: Documento comercial Chega.la

**D-012 | Cobranças erradas e falta de transparencia** (Score: 7)
O lojista recebe faturas imprecisas porque o controle e manual. Entregas cobradas a mais, entregas nao cobradas, valores divergentes entre o que foi combinado e o que foi faturado. Gera desconfianca e atrito com a empresa de entregas.
- Fonte: [Reclame Aqui — cobranças indevidas](https://www.reclameaqui.com.br/99taxis/cobranca-indevida-e-falta-de-suporte-da-99-apos-entrega-nao-realizada-por-motoboy_QKHZDlgsUUdCKATO/)

**D-013 | Comunicacao fragmentada entre lojista e empresa** (Score: 6)
A comunicacao com a empresa de entregas se perde em grupos de WhatsApp. O lojista nao sabe se sua mensagem foi vista, se o pedido foi aceito, se o motoboy ja saiu. Falta um canal dedicado e organizado.
- Fonte: [Vuupt — Problemas com motoboys](https://www.vuupt.com/post/problemas-com-motoboys-no-servico-de-delivery/)

### Dores do Motoboy (entregador)

**D-014 | Falta de transparencia no pagamento** (Score: 8)
O motoboy nao sabe exatamente quanto vai receber ao final do dia. Depende de anotacoes manuais, conversas no WhatsApp, ou da "boa vontade" do empresario para fechar a conta corretamente. Disputas sobre valores sao frequentes.
- Fonte: [Brasil de Fato — Entregadores exigem transparencia](https://www.brasildefato.com.br/2026/02/27/entregadores-rejeitam-taxa-de-r-850-em-projeto-sobre-regulacao-da-categoria-e-exigem-repasse-de-90-das-corridas/)

**D-015 | Entregas perdidas em grupos de WhatsApp** (Score: 7)
O motoboy recebe entregas via grupo de WhatsApp. Se estiver em rota, nao acompanha o fluxo de mensagens e perde oportunidades. Outro motoboy aceita antes, ou ninguem ve a mensagem a tempo.
- Fonte: [Foody Delivery](https://foodydelivery.com/blog/o-problema-do-whatsapp-nas-empresas-de-entregas/)

**D-016 | Sem roteirizacao — decide rota no instinto** (Score: 5)
O motoboy nao tem sugestao otimizada de rota. Decide por instinto qual caminho seguir, frequentemente errando e gastando mais combustivel e tempo.
- Fonte: [Motoboy Magazine — Aplicativos de controle de entregas](https://motoboymagazine.com.br/aplicativos-de-controle-de-entregas/)

---

## Ganhos (O que o cliente deseja/valoriza)

### Ganhos do Empresario

**G-001 | Painel centralizado da operacao** (Score: 10)
Um dashboard unico onde o empresario ve TUDO: pedidos entrando, motoboys em campo (posicao real), entregas em andamento, status de cada uma, metricas do dia. Substituir o caos de 10 conversas de WhatsApp por uma tela.

**G-002 | Escalar sem contratar mais atendentes** (Score: 9)
O lojista cria o pedido direto no app → motoboy recebe notificacao → aceita e vai. Zero intermediario humano digitando. A empresa pode triplicar o volume sem contratar mais gente.

**G-003 | Fechamento financeiro automatico** (Score: 8)
Ao final do dia, o sistema gera automaticamente: quanto cada motoboy fez, quanto deve receber, quanto cobrou em dinheiro, saldo a acertar. Sem planilha, sem discussao.

**G-004 | Dados e metricas para gestao** (Score: 8)
Volume de entregas por hora/dia/semana, tempo medio de entrega, performance por motoboy, bairros mais atendidos, taxa de falha. Informacao para tomar decisoes inteligentes.

**G-005 | IA progressiva que evolui com a operacao** (Score: 7)
Comecar com acompanhamento inteligente, evoluir para copiloto do atendente, e eventualmente ter agente autonomo que atende lojistas via WhatsApp sem humano. Diferencial competitivo unico.

### Ganhos do Lojista

**G-006 | Solicitar entrega em segundos** (Score: 9)
Abrir o app, preencher endereco de entrega, confirmar. Sem digitar em WhatsApp, sem esperar resposta. Pedido vai direto para a central e o motoboy mais proximo.

**G-007 | Rastreamento em tempo real** (Score: 8)
Ver no mapa onde o motoboy esta, em tempo real. Saber se ja coletou, se esta a caminho, se entregou. Poder dar respostas precisas ao cliente final: "seu pedido esta a 5 minutos".

**G-008 | Historico e faturamento transparente** (Score: 7)
Acesso ao historico de todas as entregas, com valores, datas, status. Fatura clara e conferivel. Sem surpresas na cobranca.

### Ganhos do Motoboy

**G-009 | Extrato claro do que ganhou** (Score: 8)
Ver no app quantas entregas fez, quanto vai receber, detalhamento por corrida. Transparencia total no financeiro.

**G-010 | Notificacao de entregas disponiveis** (Score: 7)
Receber push notification quando ha entrega disponivel, em vez de ter que vigiar grupo de WhatsApp. Aceitar com um toque.

**G-011 | Compartilhar localizacao sem esforco** (Score: 6)
O app compartilha a localizacao automaticamente. O motoboy nao precisa ficar mandando "to chegando" no WhatsApp. Todos veem onde ele esta.

---

## Alivios (Como o Chega.la alivia as dores)

| ID | Dor que alivia | Como alivia |
|---|---|---|
| A-001 | D-001 (Gargalo WhatsApp) | Lojista cria pedido no app → notificacao automatica → motoboy aceita. Zero WhatsApp no fluxo operacional. |
| A-002 | D-002 (Equipes inchadas) | Automacao do ciclo pedido → despacho → acompanhamento. Reduz necessidade de atendentes. |
| A-003 | D-003 (Sem visibilidade) | Rastreamento GPS em tempo real de todos os motoboys via backbone SSE. |
| A-004 | D-004 (Fechamento caixa) | Sistema calcula automaticamente entregas, valores, repasses por motoboy. |
| A-005 | D-005 (Rotas duplicadas) | Agrupamento inteligente: pedidos para mesmo bairro vao no mesmo motoboy. |
| A-006 | D-006 (Erros digitacao) | Campos estruturados com validacao — sem copiar/colar enderecos em chat. |
| A-007 | D-007 (Sem metricas) | Dashboard com KPIs: entregas/dia, tempo medio, performance por motoboy. |
| A-008 | D-008 (Escalar) | Self-service do lojista + despacho automatico = crescer sem contratar. |
| A-009 | D-010 (Sem rastreamento lojista) | Lojista acompanha entrega em tempo real no seu app. |
| A-010 | D-014 (Transparencia pgto motoboy) | Extrato detalhado por corrida, visivel no app do motoboy. |

---

## Criadores de Ganho (Como o Chega.la cria valor positivo)

| ID | Ganho que potencializa | Como cria |
|---|---|---|
| CG-001 | G-001 (Painel centralizado) | Central da Empresa com visao 360: pedidos, motoboys no mapa, status em tempo real via SSE. |
| CG-002 | G-002 (Escalar sem contratar) | App do Lojista como self-service: o proprio lojista cria pedidos sem intermediario. |
| CG-003 | G-003 (Fechamento financeiro) | Modulo financeiro: calculo automatico de repasses, historico por motoboy, export para contabilidade. |
| CG-004 | G-004 (Dados e metricas) | Analytics integrado: volumes, tempos, performance, tendencias. Base para decisoes de negocio. |
| CG-005 | G-005 (IA progressiva) | Tres niveis de IA: monitoramento → copiloto → agente autonomo. Cada nivel desbloqueia mais automacao. |
| CG-006 | G-006 (Solicitar rapido) | UX otimizado: 3 cliques para criar pedido. Enderecos salvos, favoritos, templates recorrentes. |
| CG-007 | G-007 (Rastreamento lojista) | Mapa em tempo real no app do lojista com posicao do motoboy via SSE. |
| CG-008 | G-009 (Extrato motoboy) | App do Motoboy com dashboard financeiro: corridas do dia, ganhos acumulados, historico. |

---

## Analise de Concorrentes

### Concorrente direto: Entregas Expressas (Carvs Sistemas / Dono do App LTDA)

- **O que e:** Plataforma SaaS white-label para empresas de entregas rapidas
- **3 modulos:** Painel admin + app/painel do cliente + app do entregador
- **Preco:** R$ 174 a R$ 2.145/mes (por volume de entregas)
- **Diferenciais:** 250+ empresas ativas, 5M+ pedidos, integracoes com iFood/Ze Delivery/Anota AI e 20+ plataformas, app publicavel com marca propria, fotos e assinaturas na entrega, tarifa dinamica, agrupamento de rotas
- **Fraqueza vs Chega.la:** Sem IA progressiva, sem agente autonomo de atendimento
- Fonte: [Entregas Expressas](https://entregasexpressas.com.br)

### Outros concorrentes

| Concorrente | Foco | Diferencial | Fraqueza vs Chega.la |
|---|---|---|---|
| **Foody Delivery** | Gestao de entregas + rastreamento | Integracao iFood/Neemo, entrada manual em 10-20s | Sem IA, foco em restaurantes |
| **MaisEntregas** | Plataforma completa de gestao | Desde 2018, dashboards personalizados | Sem IA, produto mais generico |
| **Bee Delivery** | Marketplace de motoboys | Conecta empresas a motoboys sob demanda | Modelo marketplace, nao de gestao |
| **Loggi** | Entregas on-demand | Escala, rede de motoboys | Nao e gestao de frota propria |
| **99 Entregas** | Entregas via rede 99 | Base de motoristas existente | Nao e para frotas proprias |

### Posicionamento do Chega.la

O Chega.la se diferencia por:
1. **IA progressiva** — nenhum concorrente oferece evolucao de monitoramento → copiloto → agente autonomo
2. **Tres modulos sincronizados em tempo real via SSE** — experiencia unificada para todos os atores
3. **Foco no empresario de frota propria** — nao e marketplace de motoboys, e ferramenta de gestao da SUA frota
4. **Branding como servico** — app com identidade visual do cliente (similar ao Entregas Expressas, mas com IA)

---

## Priorizacao — O que construir primeiro (Wave 1)

A Wave 1 deve focar no **nucleo operacional minimo** que resolva as dores de maior score e entregue os ganhos mais valorizados. Seguindo a priorizacao por score:

### Tier 1 — Critico (Score 8-10): Deve estar na Wave 1

| Prioridade | O que | Justificativa |
|---|---|---|
| 1 | Ciclo basico pedido: lojista cria → central recebe → motoboy aceita | Resolve D-001 (gargalo WhatsApp), entrega G-001/G-002/G-006 |
| 2 | Rastreamento em tempo real via SSE | Resolve D-003 (visibilidade), entrega G-007 |
| 3 | Status de entrega em tempo real | Resolve D-010 (lojista sem info), entrega G-007 |
| 4 | Gestao basica de motoboys | Resolve D-003 (visibilidade), base para dashboard |
| 5 | Registro e historico de entregas | Resolve D-007 (sem dados), base para financeiro |

### Tier 2 — Importante (Score 6-7): Waves seguintes

- Fechamento financeiro automatico (D-004 → G-003)
- Extrato do motoboy (D-014 → G-009)
- Agrupamento de rotas (D-005)
- Metricas e dashboard analitico (G-004)

### Tier 3 — Diferencial (Score 5-7): Waves futuras

- IA Nivel 1: Acompanhamento inteligente (G-005)
- Roteirizacao para motoboy (D-016)
- Templates e enderecos favoritos do lojista (G-006 avanc.)

---

## Fontes da Pesquisa

- [Foody Delivery — O problema do WhatsApp nas empresas de entregas](https://foodydelivery.com/blog/o-problema-do-whatsapp-nas-empresas-de-entregas/)
- [Foody Delivery — Sistema de gestao de entregas: fim das planilhas](https://foodydelivery.com/blog/sistema-gestao-entregas-fim-planilhas/)
- [Foody Delivery — Problemas com motoboys nos estabelecimentos](https://foodydelivery.com/blog/os-principais-problemas-com-motoboys-nos-estabelecimentos-deliveries-e-como-resolve-los/)
- [Controle na Mao — 7 maiores problemas com motoboys](https://controlenamao.com.br/blog/maiores-problemas-com-motoboys-no-delivery-e-como-resolver/)
- [Vuupt — 5 problemas frequentes com motoboys](https://www.vuupt.com/post/problemas-com-motoboys-no-servico-de-delivery/)
- [Entregas Expressas](https://entregasexpressas.com.br)
- [MaisEntregas](https://www.maisentregas.com/)
- [Foody Delivery](https://foodydelivery.com/)
- [Motoboy Magazine — Aplicativos de controle de entregas](https://motoboymagazine.com.br/aplicativos-de-controle-de-entregas/)
- [Brasil de Fato — Entregadores exigem transparencia](https://www.brasildefato.com.br/2026/02/27/entregadores-rejeitam-taxa-de-r-850-em-projeto-sobre-regulacao-da-categoria-e-exigem-repasse-de-90-das-corridas/)
- [Reclame Aqui — Cobranca indevida 99](https://www.reclameaqui.com.br/99taxis/cobranca-indevida-e-falta-de-suporte-da-99-apos-entrega-nao-realizada-por-motoboy_QKHZDlgsUUdCKATO/)
- [Logweb — Mercado logistico 2025-2026](https://logweb.com.br/mercado-logistico-brasileiro-2025-fiis-last-mile-2026/)
- Documentos internos: Documento Comercial Chega.la, Landing Page, Concorrente Entregas Expressas, Objetivo Norte, EXPERIMENTO.md
