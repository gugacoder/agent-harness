# Chega.la - Requisitos do Sistema

Requisitos funcionais (OSD) e nao funcionais (RNF) para o ecossistema Chega.la: Central da Empresa, App do Lojista e App do Motoboy.

---

## Autenticacao e Acesso

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD001 | O sistema deve permitir login com email e senha via Supabase GoTrue |
| OSD002 | O sistema deve emitir JWT apos autenticacao bem-sucedida |
| OSD003 | O sistema deve validar JWT em toda requisicao autenticada |
| OSD004 | O sistema deve suportar os perfis: admin, operator, attendant, shop, courier |
| OSD005 | O sistema deve restringir acesso a funcionalidades conforme o perfil do usuario |
| OSD006 | O sistema deve permitir recuperacao de senha por email |
| OSD007 | O sistema deve permitir convite de novos usuarios por email (operador convida lojista, motoboy, atendente) |
| OSD008 | O sistema deve bloquear acesso apos 5 tentativas consecutivas de login invalido |
| OSD009 | O sistema deve renovar JWT automaticamente antes da expiracao |
| OSD010 | O sistema deve permitir logout com invalidacao da sessao |
| OSD011 | O sistema deve associar cada usuario a uma empresa (company_id) no cadastro |
| OSD012 | O sistema deve impedir acesso a dados de empresas diferentes (isolamento por company_id) |
| OSD013 | O sistema deve permitir acesso via link direto (deep link) para lojistas e motoboys |
| OSD014 | O sistema deve suportar instalacao como PWA (add to home screen) nos tres modulos |
| OSD015 | O sistema deve registrar data e IP do ultimo login do usuario |

### Matriz de Permissoes

| Funcionalidade | admin | operator | attendant | shop | courier |
|----------------|-------|----------|-----------|------|---------|
| Gerenciar empresas | Sim | - | - | - | - |
| Configurar empresa | - | Sim | - | - | - |
| Gerenciar atendentes | - | Sim | - | - | - |
| Criar pedido (central) | - | Sim | Sim | - | - |
| Criar pedido (app) | - | - | - | Sim | - |
| Atribuir motoboy | - | Sim | Sim | - | - |
| Ver todos os pedidos | Sim | Sim | Sim | - | - |
| Ver proprios pedidos | - | - | - | Sim | Sim |
| Gerenciar motoboys | - | Sim | - | - | - |
| Gerenciar lojistas | - | Sim | Sim | - | - |
| Financeiro completo | - | Sim | - | - | - |
| Ver proprio extrato | - | - | - | Sim | Sim |
| Dashboard metricas | Sim | Sim | - | - | - |
| Mapa motoboys | - | Sim | Sim | - | - |
| Aceitar/recusar entrega | - | - | - | - | Sim |
| Registrar prova entrega | - | - | - | - | Sim |
| Configurar IA | - | Sim | - | - | - |

---

## Empresa e Configuracao

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD020 | O sistema deve permitir cadastro de empresa com nome, CNPJ, endereco e telefone |
| OSD021 | O sistema deve permitir configuracao de horario de funcionamento da empresa |
| OSD022 | O sistema deve permitir configuracao de area de cobertura por raio (km) ou poligono |
| OSD023 | O sistema deve permitir configuracao de tipos de veiculo aceitos (moto, carro, bicicleta, van) |
| OSD024 | O sistema deve permitir configuracao de tabela de precos por distancia, peso e faixa horaria |
| OSD025 | O sistema deve permitir configuracao de taxa de chuva e taxa de horario de pico |
| OSD026 | O sistema deve permitir upload de logo da empresa para white-label |
| OSD027 | O sistema deve permitir cadastro de multiplos atendentes por empresa |
| OSD028 | O sistema deve permitir definicao de permissoes por atendente |
| OSD029 | O sistema deve manter historico de alteracoes de configuracao |
| OSD030 | O sistema deve permitir configuracao de notificacoes por canal (push, email) |
| OSD031 | O sistema deve permitir cadastro de subdominio personalizado ({empresa}.chega.la) |
| OSD032 | O sistema deve gerar QR code para acesso rapido dos lojistas |
| OSD033 | O sistema deve permitir configuracao de mensagens automaticas (boas-vindas, confirmacao, entrega concluida) |
| OSD034 | O sistema deve permitir ativacao/desativacao de funcionalidades por empresa |

---

## Pedidos

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD050 | O sistema deve permitir criacao de pedido com: remetente, destinatario, endereco de coleta, endereco de entrega |
| OSD051 | O sistema deve validar enderecos de coleta e entrega via geocodificacao |
| OSD052 | O sistema deve calcular valor estimado do pedido com base na tabela de precos da empresa |
| OSD053 | O sistema deve calcular distancia e tempo estimado da rota |
| OSD054 | O sistema deve permitir adicao de observacoes e instrucoes especiais ao pedido |
| OSD055 | O sistema deve suportar os status de pedido: pending, accepted, assigned, picked_up, in_transit, delivered, cancelled, returned |
| OSD056 | O sistema deve registrar timestamp de cada transicao de status |
| OSD057 | O sistema deve validar transicoes de status (nao permitir delivered antes de picked_up) |
| OSD058 | O sistema deve permitir cancelamento de pedido antes da coleta (status < picked_up) |
| OSD059 | O sistema deve notificar partes interessadas em cada transicao de status via SSE |
| OSD060 | O sistema deve permitir busca de pedidos por numero, lojista, motoboy, status e data |
| OSD061 | O sistema deve permitir filtragem de pedidos por periodo |
| OSD062 | O sistema deve gerar numero sequencial unico por empresa para cada pedido |
| OSD063 | O sistema deve permitir edicao de pedido antes da atribuicao a motoboy |
| OSD064 | O sistema deve registrar quem criou e quem alterou cada pedido (audit) |
| OSD065 | O sistema deve permitir agendamento de pedido para data e hora futura |
| OSD066 | O sistema deve permitir pedido com multiplas paradas (coleta em A, entrega em B, entrega em C) |
| OSD067 | O sistema deve calcular valor adicional por parada extra |
| OSD068 | O sistema deve permitir indicacao de tipo de mercadoria (documento, alimento, fragil, grande porte) |
| OSD069 | O sistema deve permitir indicacao de forma de pagamento do frete (remetente, destinatario, faturado) |
| OSD070 | O sistema deve permitir registro de valor declarado do conteudo |

---

## Entregas

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD090 | O sistema deve permitir atribuicao manual de entrega a motoboy pelo operador |
| OSD091 | O sistema deve sugerir motoboy mais proximo e disponivel para atribuicao |
| OSD092 | O sistema deve permitir que motoboy aceite ou recuse entrega atribuida |
| OSD093 | O sistema deve registrar localizacao GPS do motoboy durante a entrega a cada 15 segundos |
| OSD094 | O sistema deve exibir posicao do motoboy em tempo real no mapa para operador e lojista |
| OSD095 | O sistema deve exigir prova de entrega (foto) obrigatoriamente ao concluir |
| OSD096 | O sistema deve permitir registro de assinatura digital como prova de entrega |
| OSD097 | O sistema deve calcular tempo real de cada entrega (coleta a entrega) |
| OSD098 | O sistema deve registrar distancia real percorrida via GPS |
| OSD099 | O sistema deve permitir transferencia de entrega entre motoboys |
| OSD100 | O sistema deve detectar inatividade do motoboy durante entrega (sem GPS por 5 minutos) e alertar operador |
| OSD101 | O sistema deve permitir registro de ocorrencia (cliente ausente, endereco nao encontrado, recusa) |
| OSD102 | O sistema deve permitir devolucao de mercadoria ao remetente com registro |
| OSD103 | O sistema deve calcular ETA (tempo estimado de chegada) em tempo real |
| OSD104 | O sistema deve gerar link de rastreamento publico para o destinatario final |
| OSD105 | O sistema deve exibir timeline completa de eventos de uma entrega |

---

## Motoboys e Entregadores

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD120 | O sistema deve permitir cadastro de motoboy com nome, CPF, telefone, foto, CNH e placa |
| OSD121 | O sistema deve permitir que motoboy altere status: available, busy, offline |
| OSD122 | O sistema deve registrar localizacao do motoboy quando disponivel a cada 30 segundos |
| OSD123 | O sistema deve exibir mapa com todos os motoboys disponiveis para o operador |
| OSD124 | O sistema deve calcular ranking de motoboys por entregas concluidas, avaliacao media e tempo medio |
| OSD125 | O sistema deve permitir avaliacao do motoboy pelo lojista (1 a 5 estrelas) |
| OSD126 | O sistema deve permitir bloqueio e desbloqueio de motoboy pelo operador |
| OSD127 | O sistema deve exibir dashboard de performance individual do motoboy |
| OSD128 | O sistema deve registrar historico de entregas do motoboy com filtros por periodo |
| OSD129 | O sistema deve permitir que motoboy visualize ganhos acumulados (diario, semanal, mensal) |
| OSD130 | O sistema deve suportar multiplos veiculos por motoboy |
| OSD131 | O sistema deve permitir configuracao de raio de atuacao por motoboy |
| OSD132 | O sistema deve enviar notificacao push para motoboy em nova entrega atribuida |
| OSD133 | O sistema deve permitir navegacao integrada (abrir rota no Google Maps ou Waze) |
| OSD134 | O sistema deve registrar horas trabalhadas do motoboy automaticamente (online/offline) |
| OSD135 | O sistema deve permitir que motoboy registre despesas (combustivel, manutencao) |

---

## Lojistas

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD150 | O sistema deve permitir cadastro de lojista com nome, telefone, endereco principal e CNPJ ou CPF |
| OSD151 | O sistema deve permitir que lojista crie pedido de entrega pelo app sem contatar WhatsApp |
| OSD152 | O sistema deve permitir que lojista acompanhe status da entrega em tempo real |
| OSD153 | O sistema deve permitir que lojista visualize motoboy no mapa durante a entrega |
| OSD154 | O sistema deve permitir que lojista acesse historico completo de pedidos com filtros |
| OSD155 | O sistema deve permitir que lojista salve enderecos favoritos |
| OSD156 | O sistema deve permitir que lojista visualize extrato financeiro por periodo |
| OSD157 | O sistema deve permitir que lojista avalie motoboy apos entrega concluida |
| OSD158 | O sistema deve permitir que lojista cancele pedido antes da coleta |
| OSD159 | O sistema deve permitir que lojista configure endereco de coleta padrao |
| OSD160 | O sistema deve exibir estimativa de preco antes da confirmacao do pedido |
| OSD161 | O sistema deve permitir que lojista solicite entrega recorrente (agendamento) |
| OSD162 | O sistema deve permitir que lojista exporte historico de entregas em CSV ou PDF |

---

## Financeiro

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD180 | O sistema deve registrar valor cobrado de cada entrega automaticamente |
| OSD181 | O sistema deve registrar comissao do motoboy por entrega |
| OSD182 | O sistema deve permitir fechamento financeiro diario com consolidacao de valores |
| OSD183 | O sistema deve gerar relatorio de fechamento de caixa por motoboy |
| OSD184 | O sistema deve permitir controle de creditos e debitos por motoboy |
| OSD185 | O sistema deve registrar forma de pagamento por entrega (dinheiro, pix, cartao, faturado) |
| OSD186 | O sistema deve calcular repasse do motoboy com base na comissao configurada |
| OSD187 | O sistema deve permitir ajustes manuais no financeiro (bonus, descontos, multas) |
| OSD188 | O sistema deve gerar extrato financeiro por motoboy, lojista e periodo |
| OSD189 | O sistema deve suportar faturamento mensal por lojista (conta corrente) |
| OSD190 | O sistema deve permitir exportacao de relatorios financeiros em PDF e CSV |
| OSD191 | O sistema deve registrar historico de fechamentos com auditoria |
| OSD192 | O sistema deve alertar divergencias financeiras (valor cobrado vs valor configurado) |

---

## Real-Time e SSE

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD210 | O sistema deve implementar backbone SSE com canais: /events/company/{companyId}, /events/courier/{courierId}, /events/order/{orderId} |
| OSD211 | O sistema deve enviar eventos tipados (Zod schema) via SSE a cada transicao de status de pedido |
| OSD212 | O sistema deve enviar localizacao do motoboy via SSE para canal da empresa e do pedido ativo |
| OSD213 | O sistema deve enviar notificacao de novo pedido via SSE para canal da empresa |
| OSD214 | O sistema deve manter conexao SSE ativa com reconexao automatica no client |
| OSD215 | O sistema deve autenticar conexoes SSE via JWT |
| OSD216 | O sistema deve suportar multiplos clients conectados ao mesmo canal simultaneamente |
| OSD217 | O sistema deve implementar heartbeat SSE a cada 30 segundos |
| OSD218 | O sistema deve enviar evento de atribuicao de entrega via SSE para canal do motoboy |
| OSD219 | O sistema deve isolar canais por empresa (company_id) |

---

## IA Progressiva

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD230 | O sistema deve monitorar pedidos em tempo real e alertar anomalias (atraso, inatividade) |
| OSD231 | O sistema deve sugerir motoboy ideal com base em proximidade e historico |
| OSD232 | O sistema deve detectar padroes de horario de pico e sugerir escala de motoboys |
| OSD233 | O sistema deve organizar fila de pedidos por prioridade automaticamente |
| OSD234 | O sistema deve calcular rota otimizada para entregas com multiplas paradas |
| OSD235 | O sistema deve gerar insights diarios sobre operacao (gargalos, eficiencia, anomalias) |
| OSD236 | O sistema deve disponibilizar copiloto de atendimento que sugere respostas ao atendente |
| OSD237 | O sistema deve permitir ativacao do agente autonomo por empresa (produto adicional) |
| OSD238 | O sistema deve manter log de todas as acoes e sugestoes da IA para auditoria |

---

## Notificacoes

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD250 | O sistema deve enviar push notification para motoboy em nova entrega atribuida |
| OSD251 | O sistema deve enviar push notification para lojista em mudanca de status do pedido |
| OSD252 | O sistema deve enviar push notification para operador em eventos criticos (inatividade, cancelamento) |
| OSD253 | O sistema deve enviar email de confirmacao ao lojista quando pedido for criado |
| OSD254 | O sistema deve enviar email de resumo diario de operacao para o gestor |
| OSD255 | O sistema deve permitir configuracao de preferencias de notificacao por usuario |
| OSD256 | O sistema deve registrar historico de notificacoes enviadas |

---

## Dashboard e Metricas

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD270 | O sistema deve exibir dashboard em tempo real com pedidos ativos, motoboys disponiveis e entregas do dia |
| OSD271 | O sistema deve exibir mapa com posicao de todos os motoboys em tempo real |
| OSD272 | O sistema deve calcular e exibir: tempo medio de entrega, taxa de conclusao e taxa de cancelamento |
| OSD273 | O sistema deve exibir grafico de pedidos por hora, dia, semana e mes |
| OSD274 | O sistema deve exibir ranking de motoboys por performance |
| OSD275 | O sistema deve exibir ranking de lojistas por volume de pedidos |
| OSD276 | O sistema deve permitir filtragem de todas as metricas por periodo |
| OSD277 | O sistema deve exibir faturamento consolidado no dashboard (diario, semanal, mensal) |

---

## RNF - Requisitos Nao Funcionais

| ID | Requisito |
|----|-----------|
| RNF001 | O sistema deve responder a requisicoes REST em menos de 200ms (p95) |
| RNF002 | O sistema deve entregar eventos SSE com latencia inferior a 500ms apos o fato gerador |
| RNF003 | O sistema deve suportar no minimo 1000 conexoes SSE simultaneas por instancia |
| RNF004 | O sistema deve funcionar offline no app do motoboy com queue de localizacao |
| RNF005 | O sistema deve sincronizar dados pendentes automaticamente ao reconectar |
| RNF006 | O sistema deve rodar como PWA installavel nos tres modulos |
| RNF007 | O sistema deve atingir score Lighthouse >= 90 em Performance e Acessibilidade |
| RNF008 | O sistema deve usar HTTPS em todas as comunicacoes |
| RNF009 | O sistema deve implementar rate limiting por IP e por usuario |
| RNF010 | O sistema deve armazenar senhas exclusivamente via Supabase GoTrue (bcrypt) |
| RNF011 | O sistema deve isolar dados entre empresas em todas as queries (multi-tenancy por company_id) |
| RNF012 | O sistema deve gerar logs estruturados em JSON para todas as operacoes |
| RNF013 | O sistema deve implementar healthcheck em todos os servicos |
| RNF014 | O sistema deve funcionar em Chrome, Firefox, Safari e Edge (ultimas 2 versoes) |
| RNF015 | O sistema deve ser responsivo (desktop, tablet e mobile) |
| RNF016 | O sistema deve validar todos os inputs com Zod no backend e no frontend |
| RNF017 | O sistema deve gerar OpenAPI spec automaticamente a partir das rotas Hono |
| RNF018 | O sistema deve usar Drizzle ORM para todas as operacoes de banco |
| RNF019 | O sistema deve derivar migrations do schema Drizzle (nunca SQL manual sem schema) |
| RNF020 | O sistema deve aplicar branding Chega.la: logomarca SVG, cores #222e6e, #1dace7, #fca322 |
| RNF021 | O sistema deve ser deployavel via Docker Compose com ambiente dev identico a producao |
| RNF022 | O sistema deve implementar seeds (db:seed para producao, db:seed:test para testes) sem mocks hardcoded |
| RNF023 | O sistema deve suportar localizacao pt-BR em toda a interface |
| RNF024 | O sistema deve implementar CORS configuravel por ambiente |

---

## Rastreabilidade

| Modulo | Requisitos |
|--------|------------|
| Autenticacao e Acesso | OSD001-OSD015 |
| Empresa e Configuracao | OSD020-OSD034 |
| Pedidos | OSD050-OSD070 |
| Entregas | OSD090-OSD105 |
| Motoboys e Entregadores | OSD120-OSD135 |
| Lojistas | OSD150-OSD162 |
| Financeiro | OSD180-OSD192 |
| Real-Time e SSE | OSD210-OSD219 |
| IA Progressiva | OSD230-OSD238 |
| Notificacoes | OSD250-OSD256 |
| Dashboard e Metricas | OSD270-OSD277 |
| Nao Funcionais | RNF001-RNF024 |
