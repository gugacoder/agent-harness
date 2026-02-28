# Chega.la - Requisitos Wave 1

Requisitos funcionais (OSD) e nao funcionais (RNF) para a Wave 1 do Chega.la — nucleo operacional minimo que substitui WhatsApp por fluxo estruturado de pedidos, entregas e rastreamento.

---

## Escopo da Wave 1

A Wave 1 cobre o nucleo operacional minimo — os items com score 8-10 do ranking da pesquisa:

| Prioridade | Escopo | Discoveries |
|---|---|---|
| 1 | Ciclo basico de pedido: lojista cria → central recebe → motoboy aceita | D-001 (10), G-001 (10), G-002 (9), G-006 (9) |
| 2 | Rastreamento em tempo real via SSE | D-003 (9), G-007 (8) |
| 3 | Status de entrega em tempo real | D-010 (8), G-007 (8) |
| 4 | Gestao basica de motoboys | D-003 (9) |
| 5 | Registro e historico de entregas | D-007 (8) |

**Fora do escopo da Wave 1:** Financeiro automatico (D-004), extrato do motoboy (D-014), agrupamento de rotas (D-005), metricas/dashboard avancado (G-004), IA (G-005), faturamento (G-008), roteirizacao (D-016).

---

## Autenticacao e Acesso

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD001 | O sistema deve permitir login com email e senha via Supabase GoTrue |
| OSD002 | O sistema deve emitir JWT apos autenticacao bem-sucedida |
| OSD003 | O sistema deve validar JWT em toda requisicao autenticada |
| OSD004 | O sistema deve suportar os perfis: operator, shop, courier |
| OSD005 | O sistema deve restringir acesso a funcionalidades conforme o perfil do usuario |
| OSD006 | O sistema deve permitir convite de novos usuarios por email (operador convida lojista, motoboy) |
| OSD007 | O sistema deve associar cada usuario a uma empresa (company_id) no cadastro |
| OSD008 | O sistema deve impedir acesso a dados de empresas diferentes (isolamento por company_id) |
| OSD009 | O sistema deve suportar instalacao como PWA (add to home screen) nos tres modulos |
| OSD010 | O sistema deve renovar JWT automaticamente antes da expiracao |

### Matriz de Permissoes — Wave 1

| Funcionalidade | operator | shop | courier |
|----------------|----------|------|---------|
| Configurar empresa | Sim | - | - |
| Criar pedido (central) | Sim | - | - |
| Criar pedido (app) | - | Sim | - |
| Atribuir motoboy | Sim | - | - |
| Ver todos os pedidos | Sim | - | - |
| Ver proprios pedidos | - | Sim | Sim |
| Gerenciar motoboys | Sim | - | - |
| Gerenciar lojistas | Sim | - | - |
| Mapa motoboys | Sim | - | - |
| Aceitar/recusar entrega | - | - | Sim |
| Acompanhar entrega no mapa | Sim | Sim | - |

---

## Empresa e Configuracao

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD020 | O sistema deve permitir cadastro de empresa com nome, CNPJ, endereco e telefone |
| OSD021 | O sistema deve permitir upload de logo da empresa |
| OSD022 | O sistema deve permitir cadastro de multiplos lojistas por empresa |
| OSD023 | O sistema deve permitir cadastro de multiplos motoboys por empresa |

---

## Pedidos

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD040 | O sistema deve permitir criacao de pedido com: endereco de coleta, endereco de entrega, nome e telefone do destinatario |
| OSD041 | O sistema deve suportar os status de pedido: pending, assigned, picked_up, in_transit, delivered, cancelled |
| OSD042 | O sistema deve registrar timestamp de cada transicao de status |
| OSD043 | O sistema deve validar transicoes de status (nao permitir delivered antes de picked_up) |
| OSD044 | O sistema deve permitir cancelamento de pedido antes da coleta (status < picked_up) |
| OSD045 | O sistema deve notificar partes interessadas em cada transicao de status via SSE |
| OSD046 | O sistema deve gerar numero sequencial unico por empresa para cada pedido |
| OSD047 | O sistema deve permitir adicao de observacoes ao pedido |
| OSD048 | O sistema deve permitir busca de pedidos por status |
| OSD049 | O sistema deve registrar quem criou cada pedido (audit) |

---

## Entregas

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD060 | O sistema deve permitir atribuicao manual de entrega a motoboy pelo operador |
| OSD061 | O sistema deve permitir que motoboy aceite ou recuse entrega atribuida |
| OSD062 | O sistema deve registrar localizacao GPS do motoboy durante a entrega a cada 15 segundos |
| OSD063 | O sistema deve exibir posicao do motoboy em tempo real no mapa para operador e lojista |
| OSD064 | O sistema deve calcular tempo real de cada entrega (coleta a entrega) |
| OSD065 | O sistema deve exibir timeline de eventos de uma entrega |
| OSD066 | O sistema deve registrar distancia real percorrida via GPS |

---

## Motoboys

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD080 | O sistema deve permitir cadastro de motoboy com nome, telefone e foto |
| OSD081 | O sistema deve permitir que motoboy altere status: available, busy, offline |
| OSD082 | O sistema deve registrar localizacao do motoboy quando disponivel a cada 30 segundos |
| OSD083 | O sistema deve exibir mapa com todos os motoboys disponiveis para o operador |
| OSD084 | O sistema deve enviar notificacao para motoboy em nova entrega atribuida |
| OSD085 | O sistema deve registrar historico de entregas do motoboy |
| OSD086 | O sistema deve permitir ativacao e desativacao de motoboy pelo operador |

---

## Lojistas

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD100 | O sistema deve permitir cadastro de lojista com nome, telefone e endereco |
| OSD101 | O sistema deve permitir que lojista crie pedido de entrega pelo app sem contatar WhatsApp |
| OSD102 | O sistema deve permitir que lojista acompanhe status da entrega em tempo real |
| OSD103 | O sistema deve permitir que lojista visualize motoboy no mapa durante a entrega |
| OSD104 | O sistema deve permitir que lojista acesse historico de pedidos |
| OSD105 | O sistema deve permitir que lojista cancele pedido antes da coleta |

---

## Real-Time e SSE

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD120 | O sistema deve implementar backbone SSE com canais: /events/company/{companyId}, /events/courier/{courierId}, /events/order/{orderId} |
| OSD121 | O sistema deve enviar eventos tipados (Zod schema) via SSE a cada transicao de status de pedido |
| OSD122 | O sistema deve enviar localizacao do motoboy via SSE para canal da empresa e do pedido ativo |
| OSD123 | O sistema deve enviar notificacao de novo pedido via SSE para canal da empresa |
| OSD124 | O sistema deve manter conexao SSE ativa com reconexao automatica no client |
| OSD125 | O sistema deve autenticar conexoes SSE via JWT |
| OSD126 | O sistema deve implementar heartbeat SSE a cada 30 segundos |

---

## Dashboard Basico

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD140 | O sistema deve exibir painel com pedidos ativos e seus status |
| OSD141 | O sistema deve exibir mapa com posicao de todos os motoboys em tempo real |
| OSD142 | O sistema deve exibir contagem de pedidos do dia (total, em andamento, concluidos) |

---

## RNF - Requisitos Nao Funcionais

| ID | Requisito |
|----|-----------|
| RNF001 | O sistema deve responder a requisicoes REST em menos de 200ms (p95) |
| RNF002 | O sistema deve entregar eventos SSE com latencia inferior a 500ms apos o fato gerador |
| RNF003 | O sistema deve funcionar como PWA installavel nos tres modulos |
| RNF004 | O sistema deve usar HTTPS em todas as comunicacoes |
| RNF005 | O sistema deve isolar dados entre empresas em todas as queries (multi-tenancy por company_id) |
| RNF006 | O sistema deve validar todos os inputs com Zod no backend e no frontend |
| RNF007 | O sistema deve gerar OpenAPI spec automaticamente a partir das rotas Hono |
| RNF008 | O sistema deve usar Drizzle ORM para todas as operacoes de banco |
| RNF009 | O sistema deve derivar migrations do schema Drizzle |
| RNF010 | O sistema deve aplicar branding Chega.la: logomarca SVG, cores #222e6e, #1dace7, #fca322 |
| RNF011 | O sistema deve ser deployavel via Docker Compose |
| RNF012 | O sistema deve suportar localizacao pt-BR em toda a interface |
| RNF013 | O sistema deve ser responsivo (desktop e mobile) |

---

## Rastreabilidade

| Modulo | Requisitos |
|--------|------------|
| Autenticacao e Acesso | OSD001-OSD010 |
| Empresa e Configuracao | OSD020-OSD023 |
| Pedidos | OSD040-OSD049 |
| Entregas | OSD060-OSD066 |
| Motoboys | OSD080-OSD086 |
| Lojistas | OSD100-OSD105 |
| Real-Time e SSE | OSD120-OSD126 |
| Dashboard Basico | OSD140-OSD142 |
| Nao Funcionais | RNF001-RNF013 |

---

## Rastreabilidade — Discoveries → Requisitos

| Discovery | Score | Requisitos Wave 1 |
|-----------|-------|-------------------|
| D-001 (Gargalo WhatsApp) | 10 | OSD040-OSD049, OSD101 |
| G-001 (Painel centralizado) | 10 | OSD140-OSD142, OSD083 |
| D-002 (Equipes inchadas) | 9 | OSD101, OSD040 |
| D-003 (Sem visibilidade motoboys) | 9 | OSD062-OSD063, OSD082-OSD083, OSD122, OSD141 |
| G-002 (Escalar sem contratar) | 9 | OSD101, OSD045, OSD084 |
| G-006 (Solicitar em segundos) | 9 | OSD101, OSD040 |
| D-007 (Sem metricas) | 8 | OSD085, OSD142 |
| D-008 (Escalar sem inchar) | 8 | OSD101, OSD045 |
| D-010 (Sem rastreamento lojista) | 8 | OSD102-OSD103, OSD063 |
| G-007 (Rastreamento real-time) | 8 | OSD063, OSD103, OSD122 |
