# Chega.la - User Stories Wave 1

Historias de usuario para a Wave 1 do Chega.la — foco no ciclo basico de pedido, rastreamento em tempo real e gestao de motoboys.

---

## Operador (Gestor da Empresa de Entregas)

### US001 - Criar pedido pela central

**Como** operador da empresa de entregas
**Quero** criar um pedido de entrega informando enderecos e destinatario
**Para** registrar a solicitacao sem depender de WhatsApp

**Criterios de Aceite:**
- [ ] Formulario solicita: endereco de coleta, endereco de entrega, nome e telefone do destinatario
- [ ] Campo de observacoes disponivel
- [ ] Pedido recebe numero sequencial unico por empresa
- [ ] Pedido e criado com status "pending"
- [ ] Evento SSE emitido no canal da empresa notificando novo pedido
- [ ] Pedido aparece na lista de pedidos ativos

**Requisitos:** OSD040, OSD041, OSD045, OSD046, OSD047, OSD049

---

### US002 - Atribuir motoboy a pedido

**Como** operador
**Quero** atribuir um motoboy disponivel a um pedido pendente
**Para** iniciar o processo de entrega

**Criterios de Aceite:**
- [ ] Lista de motoboys disponiveis exibida com nome e status
- [ ] Ao atribuir, pedido muda para status "assigned"
- [ ] Motoboy recebe notificacao via SSE no seu canal
- [ ] Lojista (se existir) e notificado da atribuicao via SSE
- [ ] Timestamp de atribuicao registrado

**Requisitos:** OSD060, OSD041, OSD042, OSD045, OSD084

---

### US003 - Visualizar motoboys no mapa

**Como** operador
**Quero** ver todos os motoboys no mapa em tempo real
**Para** saber a posicao da frota e tomar decisoes de despacho

**Criterios de Aceite:**
- [ ] Mapa exibe marcadores para cada motoboy com status "available" ou "busy"
- [ ] Posicao atualiza em tempo real via SSE (a cada 30s quando disponivel, 15s em entrega)
- [ ] Marcadores diferenciados por status (available vs busy)
- [ ] Clicar no marcador mostra nome do motoboy e entrega atual (se houver)

**Requisitos:** OSD083, OSD082, OSD062, OSD141

---

### US004 - Acompanhar pedidos ativos

**Como** operador
**Quero** ver todos os pedidos ativos com status atualizado em tempo real
**Para** gerenciar a operacao sem perguntar no WhatsApp

**Criterios de Aceite:**
- [ ] Lista de pedidos ativos com: numero, lojista, status, motoboy atribuido
- [ ] Status atualiza em tempo real via SSE
- [ ] Filtro por status disponivel
- [ ] Contagem de pedidos do dia: total, em andamento, concluidos
- [ ] Clicar no pedido mostra detalhes e timeline de eventos

**Requisitos:** OSD048, OSD140, OSD142, OSD065

---

### US005 - Gerenciar motoboys

**Como** operador
**Quero** cadastrar, ativar e desativar motoboys
**Para** controlar quem faz parte da minha frota

**Criterios de Aceite:**
- [ ] Formulario de cadastro: nome, telefone, foto
- [ ] Motoboy cadastrado recebe convite por email para acessar o app
- [ ] Operador pode ativar e desativar motoboy
- [ ] Lista de motoboys com status (available, busy, offline) e historico de entregas

**Requisitos:** OSD080, OSD006, OSD086, OSD085

---

### US006 - Gerenciar lojistas

**Como** operador
**Quero** cadastrar lojistas da minha empresa
**Para** que eles possam solicitar entregas pelo app

**Criterios de Aceite:**
- [ ] Formulario de cadastro: nome, telefone, endereco
- [ ] Lojista cadastrado recebe convite por email
- [ ] Lista de lojistas com pedidos recentes

**Requisitos:** OSD100, OSD006, OSD022

---

## Lojista (Cliente da Empresa de Entregas)

### US020 - Solicitar entrega pelo app

**Como** lojista
**Quero** criar um pedido de entrega em poucos cliques
**Para** nao precisar digitar dados no WhatsApp e esperar resposta

**Criterios de Aceite:**
- [ ] Formulario solicita: endereco de entrega, nome e telefone do destinatario
- [ ] Endereco de coleta pre-preenchido com endereco do lojista
- [ ] Campo de observacoes disponivel
- [ ] Confirmacao antes de enviar
- [ ] Pedido confirmado aparece na lista com status "pending"
- [ ] Notificacao SSE enviada para a central da empresa

**Requisitos:** OSD101, OSD040, OSD045

---

### US021 - Acompanhar entrega em tempo real

**Como** lojista
**Quero** ver o status da minha entrega e a posicao do motoboy no mapa
**Para** dar respostas precisas ao cliente final

**Criterios de Aceite:**
- [ ] Lista de pedidos com status atualizado em tempo real
- [ ] Ao clicar, mapa mostra posicao do motoboy em tempo real
- [ ] Timeline de eventos visivel (criado, atribuido, coletado, a caminho, entregue)
- [ ] Status atualiza automaticamente via SSE sem recarregar

**Requisitos:** OSD102, OSD103, OSD065

---

### US022 - Ver historico de pedidos

**Como** lojista
**Quero** acessar meus pedidos anteriores
**Para** conferir entregas realizadas

**Criterios de Aceite:**
- [ ] Lista de pedidos passados com: numero, data, status final
- [ ] Filtro por periodo disponivel
- [ ] Detalhes do pedido acessiveis

**Requisitos:** OSD104

---

### US023 - Cancelar pedido

**Como** lojista
**Quero** cancelar um pedido antes da coleta
**Para** corrigir erros ou desistir sem precisar ligar

**Criterios de Aceite:**
- [ ] Botao de cancelar visivel em pedidos com status "pending" ou "assigned"
- [ ] Confirmacao antes de cancelar
- [ ] Pedido muda para status "cancelled"
- [ ] Motoboy e central notificados via SSE

**Requisitos:** OSD105, OSD044, OSD045

---

## Motoboy (Entregador)

### US040 - Receber e aceitar entregas

**Como** motoboy
**Quero** receber notificacao de nova entrega e aceitar ou recusar
**Para** nao perder pedidos em grupos de WhatsApp

**Criterios de Aceite:**
- [ ] Notificacao em tempo real via SSE quando entrega e atribuida
- [ ] Tela mostra detalhes: endereco de coleta, endereco de entrega, observacoes
- [ ] Botoes "Aceitar" e "Recusar" claramente visiveis
- [ ] Ao aceitar, status muda para "accepted" e central e notificada
- [ ] Ao recusar, central e notificada para reatribuir

**Requisitos:** OSD061, OSD084, OSD045

---

### US041 - Atualizar status da entrega

**Como** motoboy
**Quero** marcar cada etapa da entrega (coletei, a caminho, entreguei)
**Para** que todos acompanhem o progresso sem precisar avisar no WhatsApp

**Criterios de Aceite:**
- [ ] Botoes de acao por etapa: "Coletei" (picked_up), "A caminho" (in_transit), "Entreguei" (delivered)
- [ ] Transicoes validadas (nao pode marcar "entreguei" antes de "coletei")
- [ ] Cada transicao gera evento SSE para canal da empresa e do pedido
- [ ] Timestamp registrado em cada transicao
- [ ] Timeline visivel para o motoboy

**Requisitos:** OSD041, OSD042, OSD043, OSD045, OSD065

---

### US042 - Compartilhar localizacao automaticamente

**Como** motoboy
**Quero** que o app compartilhe minha localizacao automaticamente
**Para** que o operador e o lojista saibam onde estou sem eu precisar avisar

**Criterios de Aceite:**
- [ ] App solicita permissao de localizacao
- [ ] Quando status "available": envia localizacao a cada 30s
- [ ] Quando em entrega ativa: envia localizacao a cada 15s
- [ ] Localizacao enviada via REST e distribuida via SSE
- [ ] Posicao aparece no mapa do operador e do lojista

**Requisitos:** OSD082, OSD062, OSD122, OSD063

---

### US043 - Alterar disponibilidade

**Como** motoboy
**Quero** marcar quando estou disponivel ou indisponivel
**Para** controlar quando recebo novas entregas

**Criterios de Aceite:**
- [ ] Toggle de status: available, offline
- [ ] Status "busy" e definido automaticamente quando tem entrega ativa
- [ ] Mudanca refletida no mapa do operador em tempo real

**Requisitos:** OSD081

---

### US044 - Ver historico de entregas

**Como** motoboy
**Quero** ver minhas entregas realizadas
**Para** saber quantas fiz e acompanhar meu trabalho

**Criterios de Aceite:**
- [ ] Lista de entregas com: data, lojista, status, tempo gasto
- [ ] Contagem de entregas do dia

**Requisitos:** OSD085

---

## Rastreabilidade

| User Story | Requisitos OSD |
|------------|----------------|
| US001 | OSD040, OSD041, OSD045, OSD046, OSD047, OSD049 |
| US002 | OSD060, OSD041, OSD042, OSD045, OSD084 |
| US003 | OSD083, OSD082, OSD062, OSD141 |
| US004 | OSD048, OSD140, OSD142, OSD065 |
| US005 | OSD080, OSD006, OSD086, OSD085 |
| US006 | OSD100, OSD006, OSD022 |
| US020 | OSD101, OSD040, OSD045 |
| US021 | OSD102, OSD103, OSD065 |
| US022 | OSD104 |
| US023 | OSD105, OSD044, OSD045 |
| US040 | OSD061, OSD084, OSD045 |
| US041 | OSD041, OSD042, OSD043, OSD045, OSD065 |
| US042 | OSD082, OSD062, OSD122, OSD063 |
| US043 | OSD081 |
| US044 | OSD085 |
