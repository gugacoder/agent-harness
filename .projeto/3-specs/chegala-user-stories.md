# Chega.la - User Stories

Historias de usuario organizadas por perfil, do menos privilegiado ao mais. Cada US referencia requisitos OSD do chegala-requirements.md.

---

## Lojista

### US001 - Acessar o app do lojista
**Como** lojista
**Quero** acessar o app pelo link direto da empresa e instalar como PWA
**Para** solicitar entregas sem depender de WhatsApp

**Criterios de Aceite:**
- [ ] Login com email e senha via Supabase GoTrue
- [ ] Link direto acessivel em qualquer dispositivo (mobile e desktop)
- [ ] Opcao de instalar como PWA (add to home screen)
- [ ] Branding Chega.la aplicado (logo SVG, cores da marca)
- [ ] Redirecionamento automatico apos login para dashboard do lojista

**Requisitos:** OSD001, OSD002, OSD013, OSD014

---

### US002 - Criar pedido de entrega
**Como** lojista
**Quero** criar um pedido de entrega preenchendo remetente, destinatario e enderecos
**Para** solicitar motoboy sem precisar ligar ou mandar mensagem

**Criterios de Aceite:**
- [ ] Formulario com campos: remetente, destinatario, endereco coleta, endereco entrega, telefones
- [ ] Autocomplete de enderecos com geocodificacao
- [ ] Calculo automatico de distancia, tempo estimado e preco
- [ ] Exibicao do valor estimado antes da confirmacao
- [ ] Selecao de tipo de mercadoria e forma de pagamento
- [ ] Campo de observacoes e instrucoes especiais
- [ ] Uso de endereco de coleta padrao pre-configurado
- [ ] Confirmacao antes do envio

**Requisitos:** OSD050, OSD051, OSD052, OSD053, OSD054, OSD068, OSD069, OSD159, OSD160

---

### US003 - Acompanhar entrega em tempo real
**Como** lojista
**Quero** ver o status da minha entrega e a posicao do motoboy no mapa
**Para** saber quando o pedido sera entregue e informar meu cliente

**Criterios de Aceite:**
- [ ] Mapa com posicao do motoboy atualizada via SSE
- [ ] Timeline de eventos da entrega (criado, coletado, em transito, entregue)
- [ ] ETA atualizado em tempo real
- [ ] Notificacao push em cada mudanca de status
- [ ] Link de rastreamento compartilhavel com destinatario

**Requisitos:** OSD094, OSD103, OSD104, OSD105, OSD152, OSD153, OSD211, OSD212

---

### US004 - Consultar historico de pedidos
**Como** lojista
**Quero** buscar e filtrar meus pedidos anteriores
**Para** acompanhar minha operacao e resolver disputas

**Criterios de Aceite:**
- [ ] Lista de pedidos com filtros: periodo, status, motoboy
- [ ] Busca por numero do pedido
- [ ] Detalhes completo de cada pedido (timeline, prova de entrega, valores)
- [ ] Exportacao em CSV ou PDF

**Requisitos:** OSD060, OSD061, OSD154, OSD162

---

### US005 - Cancelar pedido
**Como** lojista
**Quero** cancelar um pedido que ainda nao foi coletado
**Para** corrigir erros ou mudancas de plano

**Criterios de Aceite:**
- [ ] Botao de cancelamento disponivel apenas para pedidos com status anterior a picked_up
- [ ] Confirmacao antes de cancelar
- [ ] Notificacao para central e motoboy (se atribuido) via SSE
- [ ] Pedido marcado como cancelled no historico

**Requisitos:** OSD058, OSD158

---

### US006 - Salvar enderecos favoritos
**Como** lojista
**Quero** salvar enderecos que uso frequentemente
**Para** criar pedidos mais rapido sem redigitar enderecos

**Criterios de Aceite:**
- [ ] CRUD de enderecos favoritos (label, endereco, coordenadas)
- [ ] Selecao de endereco favorito ao criar pedido
- [ ] Definicao de endereco padrao de coleta

**Requisitos:** OSD155, OSD159

---

### US007 - Ver extrato financeiro
**Como** lojista
**Quero** visualizar meus gastos com entregas por periodo
**Para** controlar despesas e conferir cobranças

**Criterios de Aceite:**
- [ ] Extrato com lista de entregas, valores e formas de pagamento
- [ ] Filtro por periodo (diario, semanal, mensal, customizado)
- [ ] Totalizadores (total gasto, quantidade de entregas, ticket medio)
- [ ] Exportacao em PDF

**Requisitos:** OSD156, OSD188

---

### US008 - Avaliar motoboy
**Como** lojista
**Quero** avaliar o motoboy apos a entrega concluida
**Para** contribuir para a qualidade do servico

**Criterios de Aceite:**
- [ ] Prompt de avaliacao apos entrega concluida (1 a 5 estrelas)
- [ ] Campo opcional de comentario
- [ ] Avaliacao vinculada a entrega especifica
- [ ] Nao permitir avaliar a mesma entrega duas vezes

**Requisitos:** OSD125, OSD157

---

### US009 - Criar pedido com multiplas paradas
**Como** lojista
**Quero** criar um pedido com coleta em um ponto e entregas em multiplos destinos
**Para** otimizar entregas com varios destinatarios

**Criterios de Aceite:**
- [ ] Adicionar ate 5 paradas alem do destino principal
- [ ] Calculo de valor adicional por parada
- [ ] Visualizacao da rota com todas as paradas no mapa
- [ ] Status individual por parada

**Requisitos:** OSD066, OSD067

---

### US010 - Agendar entrega
**Como** lojista
**Quero** agendar um pedido para data e hora futura
**Para** planejar entregas com antecedencia

**Criterios de Aceite:**
- [ ] Seletor de data e hora no formulario de pedido
- [ ] Validacao de horario dentro do funcionamento da empresa
- [ ] Pedido aparece como agendado no historico
- [ ] Notificacao para central quando chegar o horario

**Requisitos:** OSD065, OSD161

---

## Motoboy

### US020 - Acessar o app do motoboy
**Como** motoboy
**Quero** acessar o app pelo link direto e instalar no celular como PWA
**Para** gerenciar minhas entregas sem depender de ligacao ou WhatsApp

**Criterios de Aceite:**
- [ ] Login com email e senha
- [ ] Instalacao como PWA com icone na tela inicial
- [ ] Interface mobile-first otimizada
- [ ] Branding Chega.la

**Requisitos:** OSD001, OSD013, OSD014

---

### US021 - Alterar disponibilidade
**Como** motoboy
**Quero** alternar entre disponivel, ocupado e offline
**Para** controlar quando estou pronto para receber entregas

**Criterios de Aceite:**
- [ ] Toggle de status com tres estados (available, busy, offline)
- [ ] Compartilhamento de localizacao GPS quando disponivel (a cada 30s)
- [ ] Parar compartilhamento quando offline
- [ ] Status visivel na Central da Empresa em tempo real

**Requisitos:** OSD121, OSD122

---

### US022 - Receber e aceitar entrega
**Como** motoboy
**Quero** receber notificacao de nova entrega e decidir aceitar ou recusar
**Para** gerenciar minha carga de trabalho

**Criterios de Aceite:**
- [ ] Push notification em nova entrega atribuida
- [ ] Tela com detalhes: endereco coleta, endereco entrega, valor, distancia
- [ ] Botoes aceitar e recusar
- [ ] Tempo limite para responder (configuravel pela empresa)
- [ ] Se recusado, entrega volta para fila da central

**Requisitos:** OSD092, OSD132, OSD218, OSD250

---

### US023 - Navegar ate coleta e entrega
**Como** motoboy
**Quero** abrir a rota da entrega no Google Maps ou Waze
**Para** chegar ao destino sem errar o caminho

**Criterios de Aceite:**
- [ ] Botao "Navegar" que abre app de navegacao com endereco pre-preenchido
- [ ] Suporte a Google Maps e Waze
- [ ] Endereco de coleta e entrega disponiveis separadamente
- [ ] Funciona com deep link nativo do dispositivo

**Requisitos:** OSD133

---

### US024 - Registrar prova de entrega
**Como** motoboy
**Quero** tirar foto e coletar assinatura ao concluir a entrega
**Para** comprovar que o pedido foi entregue corretamente

**Criterios de Aceite:**
- [ ] Camera para foto obrigatoria ao marcar como entregue
- [ ] Opcao de captura de assinatura digital na tela
- [ ] Upload para Supabase Storage
- [ ] Registro de coordenadas GPS no momento da captura
- [ ] Prova visivel no historico do pedido para todas as partes

**Requisitos:** OSD095, OSD096

---

### US025 - Ver ganhos e historico
**Como** motoboy
**Quero** ver quanto ganhei hoje, nesta semana e neste mes
**Para** acompanhar minha renda

**Criterios de Aceite:**
- [ ] Dashboard com ganhos acumulados: diario, semanal, mensal
- [ ] Lista de entregas concluidas com valor de comissao
- [ ] Filtro por periodo
- [ ] Total de entregas e tempo trabalhado

**Requisitos:** OSD127, OSD128, OSD129, OSD134

---

### US026 - Registrar ocorrencia
**Como** motoboy
**Quero** reportar problemas durante a entrega (cliente ausente, endereco nao encontrado)
**Para** documentar situacoes que impedem a conclusao normal

**Criterios de Aceite:**
- [ ] Selecao de tipo de ocorrencia (ausente, nao encontrado, recusa, outro)
- [ ] Campo de descricao
- [ ] Foto opcional
- [ ] Notificacao para operador via SSE
- [ ] Opcao de devolucao ao remetente

**Requisitos:** OSD101, OSD102

---

### US027 - Ver performance
**Como** motoboy
**Quero** ver meu ranking, avaliacao media e estatisticas
**Para** melhorar meu desempenho

**Criterios de Aceite:**
- [ ] Avaliacao media (estrelas)
- [ ] Total de entregas no periodo
- [ ] Tempo medio de entrega
- [ ] Posicao no ranking da empresa

**Requisitos:** OSD124, OSD127

---

### US028 - Registrar despesas
**Como** motoboy
**Quero** registrar gastos com combustivel e manutencao
**Para** controlar meus custos operacionais

**Criterios de Aceite:**
- [ ] Formulario: tipo (combustivel, manutencao, pedagio), valor, descricao
- [ ] Upload opcional de comprovante
- [ ] Historico de despesas com filtro por periodo e tipo
- [ ] Totalizador por periodo

**Requisitos:** OSD135

---

## Operador e Gestor

### US040 - Acessar dashboard em tempo real
**Como** operador
**Quero** ver dashboard com visao geral da operacao
**Para** tomar decisoes rapidas e gerenciar a empresa

**Criterios de Aceite:**
- [ ] Contadores: pedidos ativos, motoboys disponiveis, entregas do dia, faturamento
- [ ] Mapa com posicao de todos os motoboys em tempo real
- [ ] Atualizacao automatica via SSE (sem refresh manual)
- [ ] Alertas de anomalias (motoboy inativo, atraso)
- [ ] Graficos de pedidos por hora

**Requisitos:** OSD270, OSD271, OSD272, OSD273, OSD230

---

### US041 - Criar pedido pela central
**Como** operador
**Quero** criar pedido manualmente na central
**Para** registrar pedidos recebidos por telefone ou WhatsApp

**Criterios de Aceite:**
- [ ] Mesmo formulario do lojista com campos adicionais
- [ ] Selecao de lojista existente ou preenchimento manual
- [ ] Atribuicao imediata de motoboy (opcional)
- [ ] Numero sequencial gerado automaticamente

**Requisitos:** OSD050, OSD062, OSD064

---

### US042 - Atribuir motoboy a pedido
**Como** operador
**Quero** atribuir um motoboy a um pedido pendente
**Para** despachar entregas para os entregadores

**Criterios de Aceite:**
- [ ] Lista de motoboys disponiveis com distancia do ponto de coleta
- [ ] Sugestao automatica do motoboy mais proximo
- [ ] Mapa com posicao dos motoboys disponiveis
- [ ] Notificacao push e SSE para motoboy atribuido
- [ ] Status do pedido muda para assigned

**Requisitos:** OSD090, OSD091, OSD123, OSD218, OSD231

---

### US043 - Gerenciar motoboys
**Como** operador
**Quero** cadastrar, editar, bloquear e desbloquear motoboys
**Para** manter o quadro de entregadores atualizado

**Criterios de Aceite:**
- [ ] CRUD de motoboy (nome, CPF, telefone, foto, CNH, placa)
- [ ] Visualizacao de status atual (available, busy, offline)
- [ ] Botao de bloqueio/desbloqueio
- [ ] Convite por email para motoboy acessar o app
- [ ] Ranking de performance

**Requisitos:** OSD120, OSD121, OSD124, OSD126, OSD007

---

### US044 - Gerenciar lojistas
**Como** operador
**Quero** cadastrar e editar lojistas
**Para** manter a base de clientes organizada

**Criterios de Aceite:**
- [ ] CRUD de lojista (nome, documento, telefone, endereco)
- [ ] Convite por email para lojista acessar o app
- [ ] QR code para acesso rapido do lojista
- [ ] Historico de pedidos do lojista
- [ ] Ranking por volume

**Requisitos:** OSD150, OSD007, OSD032, OSD275

---

### US045 - Acompanhar entregas no mapa
**Como** operador
**Quero** ver todas as entregas em andamento no mapa com posicao dos motoboys
**Para** monitorar a operacao em tempo real

**Criterios de Aceite:**
- [ ] Mapa com marcadores de motoboys em entrega
- [ ] Marcadores de pontos de coleta e entrega
- [ ] ETA de cada entrega
- [ ] Clique no marcador abre detalhes da entrega
- [ ] Alerta visual de motoboy inativo (sem GPS por 5 min)
- [ ] Atualizacao via SSE

**Requisitos:** OSD094, OSD100, OSD103, OSD212, OSD271

---

### US046 - Transferir entrega
**Como** operador
**Quero** transferir uma entrega de um motoboy para outro
**Para** reagir a imprevistos (motoboy com problema, redistribuicao)

**Criterios de Aceite:**
- [ ] Selecao de nova entrega e novo motoboy
- [ ] Notificacao para ambos os motoboys via SSE
- [ ] Registro no timeline de eventos da entrega
- [ ] Motivo da transferencia

**Requisitos:** OSD099

---

### US047 - Fazer fechamento financeiro
**Como** operador
**Quero** fechar o caixa diario com consolidacao de valores
**Para** controlar financas e acertar com motoboys

**Criterios de Aceite:**
- [ ] Tela de fechamento com: total pedidos, receita, comissoes, ajustes, resultado liquido
- [ ] Fechamento por motoboy com detalhes de cada entrega
- [ ] Ajustes manuais (bonus, descontos, multas)
- [ ] Confirmacao de fechamento (irreversivel)
- [ ] Historico de fechamentos com auditoria
- [ ] Exportacao em PDF e CSV

**Requisitos:** OSD182, OSD183, OSD184, OSD186, OSD187, OSD190, OSD191

---

### US048 - Configurar empresa
**Como** operador
**Quero** configurar horarios, area de cobertura, precos e notificacoes
**Para** adaptar o sistema a minha operacao

**Criterios de Aceite:**
- [ ] Formulario de horarios de funcionamento por dia da semana
- [ ] Mapa para definir area de cobertura (raio ou poligono)
- [ ] Tabela de precos (base, por km, por parada, multiplicadores)
- [ ] Taxas adicionais (chuva, horario de pico)
- [ ] Configuracao de mensagens automaticas
- [ ] Configuracao de notificacoes

**Requisitos:** OSD021, OSD022, OSD024, OSD025, OSD030, OSD033

---

### US049 - Gerenciar atendentes
**Como** operador
**Quero** cadastrar atendentes e definir suas permissoes
**Para** delegar tarefas sem dar acesso total

**Criterios de Aceite:**
- [ ] CRUD de atendentes
- [ ] Convite por email
- [ ] Definicao de permissoes granulares (ver pedidos, atribuir, financeiro)
- [ ] Revogacao de acesso

**Requisitos:** OSD027, OSD028, OSD007

---

### US050 - Visualizar metricas de operacao
**Como** operador
**Quero** ver graficos e estatisticas da operacao
**Para** identificar gargalos e oportunidades

**Criterios de Aceite:**
- [ ] Tempo medio de entrega por periodo
- [ ] Taxa de conclusao e taxa de cancelamento
- [ ] Grafico de pedidos por hora/dia/semana/mes
- [ ] Ranking de motoboys por performance
- [ ] Ranking de lojistas por volume
- [ ] Faturamento consolidado por periodo
- [ ] Filtro por periodo em todas as metricas

**Requisitos:** OSD272, OSD273, OSD274, OSD275, OSD276, OSD277

---

### US051 - Usar copiloto IA
**Como** operador
**Quero** receber sugestoes inteligentes da IA sobre a operacao
**Para** tomar decisoes melhores e mais rapidas

**Criterios de Aceite:**
- [ ] Sugestao de motoboy ideal para cada pedido
- [ ] Alerta de anomalias (atraso, inatividade)
- [ ] Deteccao de padroes de horario de pico
- [ ] Insights diarios sobre operacao (gargalos, eficiencia)
- [ ] Log de todas as sugestoes da IA

**Requisitos:** OSD230, OSD231, OSD232, OSD233, OSD235, OSD238

---

## Atendente

### US070 - Acessar central com permissoes restritas
**Como** atendente
**Quero** acessar a central da empresa com as permissoes definidas pelo operador
**Para** executar minhas tarefas sem acesso a funcoes que nao me competem

**Criterios de Aceite:**
- [ ] Login com email e senha
- [ ] Menu e funcionalidades filtradas conforme permissoes do perfil
- [ ] Funcoes nao autorizadas ocultas (nao apenas desabilitadas)

**Requisitos:** OSD001, OSD005, OSD028

---

### US071 - Gerenciar pedidos ativos
**Como** atendente
**Quero** ver, criar e gerenciar pedidos da empresa
**Para** atender clientes que solicitam entregas

**Criterios de Aceite:**
- [ ] Lista de pedidos ativos com status em tempo real
- [ ] Criacao de novo pedido
- [ ] Atribuicao de motoboy (se autorizado)
- [ ] Busca e filtros por status, lojista, periodo

**Requisitos:** OSD050, OSD060, OSD061, OSD090

---

### US072 - Usar copiloto de atendimento
**Como** atendente
**Quero** receber sugestoes da IA para agilizar o atendimento
**Para** atender mais rapido e com menos erros

**Criterios de Aceite:**
- [ ] Sugestoes de resposta no atendimento
- [ ] Priorizacao automatica da fila de pedidos
- [ ] Indicador visual de sugestao da IA

**Requisitos:** OSD233, OSD236

---

## Admin

### US085 - Gerenciar empresas
**Como** admin
**Quero** cadastrar, suspender e gerenciar empresas na plataforma
**Para** controlar o acesso de clientes ao Chega.la

**Criterios de Aceite:**
- [ ] CRUD de empresas (nome, CNPJ, endereco, subdominio)
- [ ] Ativacao, suspensao e cancelamento de empresa
- [ ] Visualizacao de metricas por empresa

**Requisitos:** OSD020, OSD031, OSD033

---

### US086 - Monitorar saude da plataforma
**Como** admin
**Quero** ver status de todos os servicos e metricas globais
**Para** garantir estabilidade e disponibilidade

**Criterios de Aceite:**
- [ ] Dashboard com status de cada servico (healthcheck)
- [ ] Metricas de uso (conexoes SSE, requests/s, latencia)
- [ ] Alertas de degradacao

**Requisitos:** RNF001, RNF002, RNF003, RNF013

---

## Rastreabilidade

| User Story | Requisitos OSD |
|------------|----------------|
| US001 | OSD001, OSD002, OSD013, OSD014 |
| US002 | OSD050-OSD054, OSD068, OSD069, OSD159, OSD160 |
| US003 | OSD094, OSD103-OSD105, OSD152, OSD153, OSD211, OSD212 |
| US004 | OSD060, OSD061, OSD154, OSD162 |
| US005 | OSD058, OSD158 |
| US006 | OSD155, OSD159 |
| US007 | OSD156, OSD188 |
| US008 | OSD125, OSD157 |
| US009 | OSD066, OSD067 |
| US010 | OSD065, OSD161 |
| US020 | OSD001, OSD013, OSD014 |
| US021 | OSD121, OSD122 |
| US022 | OSD092, OSD132, OSD218, OSD250 |
| US023 | OSD133 |
| US024 | OSD095, OSD096 |
| US025 | OSD127-OSD129, OSD134 |
| US026 | OSD101, OSD102 |
| US027 | OSD124, OSD127 |
| US028 | OSD135 |
| US040 | OSD230, OSD270-OSD273 |
| US041 | OSD050, OSD062, OSD064 |
| US042 | OSD090, OSD091, OSD123, OSD218, OSD231 |
| US043 | OSD007, OSD120, OSD121, OSD124, OSD126 |
| US044 | OSD007, OSD032, OSD150, OSD275 |
| US045 | OSD094, OSD100, OSD103, OSD212, OSD271 |
| US046 | OSD099 |
| US047 | OSD182-OSD184, OSD186, OSD187, OSD190, OSD191 |
| US048 | OSD021, OSD022, OSD024, OSD025, OSD030, OSD033 |
| US049 | OSD007, OSD027, OSD028 |
| US050 | OSD272-OSD277 |
| US051 | OSD230-OSD233, OSD235, OSD238 |
| US070 | OSD001, OSD005, OSD028 |
| US071 | OSD050, OSD060, OSD061, OSD090 |
| US072 | OSD233, OSD236 |
| US085 | OSD020, OSD031, OSD033 |
| US086 | RNF001-RNF003, RNF013 |
