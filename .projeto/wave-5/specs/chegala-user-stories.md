# Chega.la - User Stories Wave 5

Historias de usuario para Enderecos Inteligentes, Completude de Interfaces e Usabilidade Real. Agrupadas por perfil de usuario.

---

## Lojista

### US501 - Autocomplete de endereco ao criar pedido
**Como** lojista
**Quero** digitar parte do endereco e selecionar de uma lista de sugestoes
**Para** criar pedidos rapidamente sem digitar o endereco completo

**Criterios de Aceite:**
- [ ] Campo de endereco exibe dropdown com sugestoes apos 3 caracteres e debounce de 300ms
- [ ] Sugestoes vem de ViaCEP (se CEP) ou Nominatim/HERE (se texto)
- [ ] Texto digitado aparece em negrito nas sugestoes
- [ ] Ao selecionar sugestao, campos de endereco e coordenadas preenchidos automaticamente
- [ ] Mapa centraliza no endereco selecionado com zoom nivel 17
- [ ] Navegacao por setas, Enter para selecionar, Esc para fechar

**Requisitos:** OSD501, OSD502, OSD503, OSD504, OSD507, OSD508, OSD510, OSD511, OSD512

---

### US502 - Preenchimento por CEP
**Como** lojista
**Quero** digitar o CEP e ter rua, bairro, cidade e estado preenchidos automaticamente
**Para** evitar erros de digitacao e acelerar o cadastro de enderecos

**Criterios de Aceite:**
- [ ] Ao digitar CEP valido (8 digitos), sistema busca via ViaCEP/BrasilAPI
- [ ] Campos de rua, bairro, cidade, estado preenchidos automaticamente
- [ ] Se CEP invalido, exibe mensagem "CEP nao encontrado"
- [ ] Foco move automaticamente para o campo "numero" apos preenchimento

**Requisitos:** OSD501

---

### US503 - Selecao de ponto no mapa (pin drop)
**Como** lojista
**Quero** selecionar um ponto no mapa arrastando o marcador
**Para** indicar com precisao o local de entrega quando o endereco textual e impreciso

**Criterios de Aceite:**
- [ ] Mapa exibe marcador arrastavel (Leaflet marker draggable)
- [ ] Ao soltar o pin, geocoding reverso preenche campo de endereco
- [ ] Coordenadas atualizadas em tempo real ao arrastar
- [ ] Instrucao visual "Arraste o pin para ajustar a localizacao" exibida

**Requisitos:** OSD505, OSD506, RNF502

---

### US504 - Selecao de endereco salvo ao criar pedido
**Como** lojista
**Quero** selecionar um endereco previamente usado ou favoritado ao criar um pedido
**Para** nao digitar o mesmo endereco toda vez que faço entregas recorrentes

**Criterios de Aceite:**
- [ ] Dropdown "Selecionar endereco salvo" aparece acima do campo de endereco
- [ ] Favoritos exibidos primeiro com icone de estrela, depois recentes por frequencia
- [ ] Ao selecionar, todos os campos de endereco e coordenadas preenchidos
- [ ] Opcao "Digitar novo endereco" disponivel no final da lista
- [ ] Badge de uso exibido (ex: "Usado 15 vezes")

**Requisitos:** OSD534, OSD535, OSD536, OSD538

---

### US505 - Enderecos salvos automaticamente
**Como** lojista
**Quero** que enderecos de entregas bem-sucedidas sejam salvos automaticamente
**Para** reutiliza-los em pedidos futuros sem acao manual

**Criterios de Aceite:**
- [ ] Apos pedido criado com sucesso, endereco de destino salvo automaticamente
- [ ] Maximo 10 enderecos recentes mantidos por lojista (FIFO)
- [ ] Endereco nao duplicado se ja existe nos salvos (atualiza use_count e last_used_at)

**Requisitos:** OSD530, OSD531

---

### US506 - Favoritar endereco salvo
**Como** lojista
**Quero** marcar enderecos frequentes como favoritos com um nome amigavel
**Para** encontra-los rapidamente ao criar pedidos

**Criterios de Aceite:**
- [ ] Toggle de estrela para marcar/desmarcar favorito
- [ ] Campo de label editavel (ex: "Filial Centro")
- [ ] Favoritos aparecem no topo da lista de enderecos salvos

**Requisitos:** OSD532, OSD533

---

### US507 - Gestao de enderecos salvos
**Como** lojista
**Quero** visualizar, editar e excluir meus enderecos salvos numa tela dedicada
**Para** manter minha lista de enderecos organizada

**Criterios de Aceite:**
- [ ] Tela "Meus Enderecos" acessivel no menu
- [ ] Lista com label, endereco, badge favorito e contagem de uso
- [ ] Criar novo endereco com autocomplete + pin drop
- [ ] Editar label, endereco, complemento e referencia
- [ ] Excluir com confirmacao
- [ ] Ordenar por: mais usados, recentes, alfabetico

**Requisitos:** OSD540, OSD541, OSD542, OSD543, OSD544, OSD545

---

### US508 - Ver estimativa de custo antes de confirmar pedido
**Como** lojista
**Quero** ver quanto a entrega vai custar antes de confirmar o pedido
**Para** tomar decisao informada e saber exatamente quanto vou pagar

**Criterios de Aceite:**
- [ ] Apos preencher endereco de destino, estimativa de custo exibida automaticamente
- [ ] Calculo baseado na pricing table ativa da empresa (ou override do lojista)
- [ ] Exibe distancia estimada e valor estimado
- [ ] Atualiza se endereco for alterado

**Requisitos:** OSD625

---

### US509 - Filtrar historico de pedidos
**Como** lojista
**Quero** filtrar meu historico de pedidos por data, status e valor
**Para** encontrar pedidos especificos e ter controle sobre minha operacao

**Criterios de Aceite:**
- [ ] Filtro por range de datas (date picker)
- [ ] Filtro por status (pendente, em transito, entregue, cancelado)
- [ ] Filtro por faixa de valor
- [ ] Filtros combinaveis entre si
- [ ] Contagem de resultados exibida

**Requisitos:** OSD626

---

### US510 - Ver detalhes da entrega com timeline
**Como** lojista
**Quero** ver a timeline completa de uma entrega com nome do motoboy e comprovante
**Para** acompanhar o progresso e ter comprovacao da entrega

**Criterios de Aceite:**
- [ ] Timeline visual com status e timestamps
- [ ] Nome e foto do motoboy atribuido
- [ ] POD (foto + assinatura) exibido se disponivel
- [ ] Endereco de destino com mapa

**Requisitos:** OSD627

---

## Operador

### US530 - CRUD completo de lojas
**Como** operador
**Quero** visualizar detalhes, editar dados e desativar lojas
**Para** gerenciar lojas de forma completa sem acessar o banco de dados

**Criterios de Aceite:**
- [ ] Lista com avatar, nome, telefone, endereco, status badge, total pedidos, ultimo pedido
- [ ] Filtros por status (ativo/inativo) e busca por nome
- [ ] Tela de detalhes com dados cadastrais, mapa e resumo de atividade
- [ ] Historico de pedidos dos ultimos 30 dias na tela de detalhes
- [ ] Resumo financeiro: total faturado, pendente, ultimo pagamento
- [ ] Drawer/modal de edicao: nome, telefone, endereco (autocomplete), contato
- [ ] Desativar/reativar com confirmacao e aviso sobre pedidos em andamento

**Requisitos:** OSD550, OSD551, OSD552, OSD553, OSD554, OSD555, OSD556, OSD557

---

### US531 - CRUD completo de motoboys
**Como** operador
**Quero** visualizar detalhes, metricas, editar dados e desativar motoboys
**Para** gerenciar a frota com ficha completa por entregador

**Criterios de Aceite:**
- [ ] Lista com foto, nome, status badge, telefone, total entregas
- [ ] Filtros por status (online/offline/busy), ativo/inativo e busca por nome
- [ ] Mapa com localizacao dos motoboys ativos na listagem
- [ ] Tela de detalhes com dados pessoais, localizacao atual e metricas
- [ ] Metricas: entregas hoje, entregas mes, tempo medio, taxa de conclusao
- [ ] Historico de entregas dos ultimos 30 dias
- [ ] Earnings acumulados com periodo selecionavel
- [ ] Edicao: nome, telefone, tipo de veiculo, placa
- [ ] Desativar/reativar com confirmacao

**Requisitos:** OSD570, OSD571, OSD572, OSD573, OSD574, OSD575, OSD576, OSD577, OSD578

---

### US532 - Diagnostico visual de GPS na Central
**Como** operador
**Quero** ver indicadores visuais de qualidade do GPS de cada motoboy
**Para** diagnosticar rapidamente por que um motoboy nao aparece no mapa

**Criterios de Aceite:**
- [ ] Badge de cor ao lado do nome: verde (< 1 min), amarelo (1-5 min), vermelho (> 5 min), cinza (sem dados)
- [ ] Stale markers removidos automaticamente apos 10 minutos
- [ ] Mapa reajusta bounds ao detectar novos motoboys online

**Requisitos:** OSD590, OSD594, OSD595

---

### US533 - Dashboard com metricas de hoje
**Como** operador
**Quero** ver metricas em tempo real no dashboard: entregas do dia, motoboys online, pedidos pendentes
**Para** ter visao instantanea da operacao atual

**Criterios de Aceite:**
- [ ] Cards "Hoje" com valores atualizados via SSE
- [ ] Entregas do dia (total + concluidas)
- [ ] Motoboys online agora (contagem)
- [ ] Pedidos pendentes agora (contagem)

**Requisitos:** OSD610

---

### US534 - Timeline visual de pedidos
**Como** operador
**Quero** ver a timeline completa de um pedido com status e timestamps
**Para** acompanhar o progresso e identificar gargalos

**Criterios de Aceite:**
- [ ] Timeline vertical com icones por status
- [ ] Timestamp em cada transicao de status
- [ ] Status atual destacado visualmente
- [ ] Acessivel via tela de detalhes do pedido

**Requisitos:** OSD611

---

### US535 - Bulk assign de pedidos
**Como** operador
**Quero** selecionar multiplos pedidos pendentes e atribui-los ao mesmo motoboy de uma vez
**Para** agilizar o despacho em horarios de pico

**Criterios de Aceite:**
- [ ] Checkbox de selecao em cada pedido pendente
- [ ] Botao "Atribuir selecionados" habilitado quando >= 1 pedido selecionado
- [ ] Modal para selecionar motoboy (lista de motoboys online)
- [ ] Confirmacao com contagem de pedidos
- [ ] Feedback de sucesso/erro por pedido

**Requisitos:** OSD612

---

## Motoboy

### US560 - Banner de GPS desativado
**Como** motoboy
**Quero** ser alertado quando meu GPS esta desativado ou sem permissao
**Para** resolver o problema e garantir que apareco no mapa para receber entregas

**Criterios de Aceite:**
- [ ] Banner persistente vermelho no topo do app quando GPS desativado
- [ ] Mensagem: "Ative sua localizacao para receber entregas"
- [ ] Banner desaparece automaticamente quando permissao e concedida
- [ ] Localizacao enviada imediatamente ao mudar status para "online"

**Requisitos:** OSD591, OSD592

---

### US561 - Navegar para endereco de entrega
**Como** motoboy
**Quero** abrir o endereco de destino no Google Maps ou Waze com um toque
**Para** navegar ate o local sem copiar o endereco manualmente

**Criterios de Aceite:**
- [ ] Botao "Navegar" visivel na tela de entrega ativa
- [ ] Abre app de navegacao com coordenadas de destino preenchidas
- [ ] Fallback para Google Maps web se apps nativos nao disponiveis
- [ ] Funciona em Android e iOS (deep links)

**Requisitos:** OSD645

---

### US562 - Notificacao sonora de nova entrega
**Como** motoboy
**Quero** receber notificacao sonora e vibracao quando uma nova entrega for atribuida
**Para** nao perder entregas quando o app esta em segundo plano

**Criterios de Aceite:**
- [ ] Som de notificacao ao receber nova entrega via SSE
- [ ] Vibracao do dispositivo (navigator.vibrate)
- [ ] Funciona com app em foreground e background (service worker)

**Requisitos:** OSD646

---

### US563 - Ver info antes de aceitar entrega
**Como** motoboy
**Quero** ver distancia estimada e valor estimado antes de aceitar uma entrega
**Para** decidir se vale a pena aceitar com base no custo-beneficio

**Criterios de Aceite:**
- [ ] Distancia estimada (km) exibida no card de nova entrega
- [ ] Valor estimado (R$) exibido no card de nova entrega
- [ ] Endereco de destino visivel
- [ ] Botoes "Aceitar" e "Recusar" abaixo das informacoes

**Requisitos:** OSD647

---

### US564 - Contexto visual na pagina de status
**Como** motoboy
**Quero** ver informacoes uteis na pagina de status: quantas entregas disponiveis, minha posicao
**Para** entender por que ficar online e ter motivacao para trabalhar

**Criterios de Aceite:**
- [ ] Mensagem contextual: "Voce esta online — N entregas disponiveis na regiao"
- [ ] Se offline: "Fique online para receber entregas"
- [ ] Mapa com posicao atual do motoboy

**Requisitos:** OSD648

---

## Rastreabilidade

| User Story | Requisitos OSD |
|------------|----------------|
| US501 | OSD501-OSD504, OSD507-OSD512, RNF501 |
| US502 | OSD501 |
| US503 | OSD505, OSD506, RNF502 |
| US504 | OSD534-OSD536, OSD538 |
| US505 | OSD530, OSD531 |
| US506 | OSD532, OSD533 |
| US507 | OSD540-OSD545 |
| US508 | OSD625 |
| US509 | OSD626 |
| US510 | OSD627 |
| US530 | OSD550-OSD557 |
| US531 | OSD570-OSD578 |
| US532 | OSD590, OSD594, OSD595 |
| US533 | OSD610 |
| US534 | OSD611 |
| US535 | OSD612 |
| US560 | OSD591, OSD592 |
| US561 | OSD645 |
| US562 | OSD646 |
| US563 | OSD647 |
| US564 | OSD648 |
