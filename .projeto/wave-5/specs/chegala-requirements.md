# Chega.la - Requisitos Wave 5

Requisitos funcionais e nao-funcionais para Enderecos Inteligentes, Completude de Interfaces e Usabilidade Real. Incremental sobre waves anteriores.

---

## Geocoding e Autocomplete

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD501 | O sistema deve preencher automaticamente rua, bairro, cidade e estado ao digitar um CEP valido (integracao ViaCEP/BrasilAPI) |
| OSD502 | O sistema deve exibir sugestoes de endereco em dropdown conforme o usuario digita (minimo 3 caracteres, debounce 300ms) |
| OSD503 | O sistema deve preencher latitude e longitude automaticamente ao selecionar uma sugestao de endereco |
| OSD504 | O sistema deve utilizar geocoding em camadas: 1) ViaCEP por CEP, 2) Nominatim/HERE por texto, 3) pin drop manual |
| OSD505 | O sistema deve exibir marcador arrastavel no mapa (Leaflet) para selecao de ponto (pin drop) |
| OSD506 | O sistema deve realizar geocoding reverso ao soltar o pin no mapa, preenchendo o campo de endereco com o resultado |
| OSD507 | O sistema deve centralizar o mapa e aplicar zoom nivel 17 ao selecionar um endereco no dropdown |
| OSD508 | O sistema deve destacar em negrito a parte do texto digitado nas sugestoes do dropdown |
| OSD509 | O sistema deve exibir icone de tipo (casa, loja, rua) ao lado de cada sugestao |
| OSD510 | O sistema deve exibir spinner de loading durante a busca de sugestoes |
| OSD511 | O sistema deve exibir mensagem "Nenhum endereco encontrado. Tente o CEP ou selecione no mapa." quando nao houver resultados |
| OSD512 | O sistema deve permitir navegacao por setas do teclado, Enter para selecionar e Esc para fechar o dropdown |

### RNF - Requisitos Nao Funcionais

| ID | Requisito |
|----|-----------|
| RNF501 | O autocomplete deve responder em menos de 500ms apos o debounce de 300ms |
| RNF502 | O geocoding reverso (pin drop) deve responder em menos de 1 segundo |
| RNF503 | O sistema deve funcionar com Nominatim self-hosted ou HERE free tier (250K requests/mes) como fallback |

---

## Enderecos Salvos

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD530 | O sistema deve salvar automaticamente o endereco de destino apos cada pedido criado com sucesso |
| OSD531 | O sistema deve manter os ultimos 10 enderecos usados por lojista, ordenados por data de uso |
| OSD532 | O sistema deve permitir marcar/desmarcar um endereco salvo como favorito |
| OSD533 | O sistema deve permitir atribuir label a um endereco salvo (ex: "Filial Centro", "Cliente X") |
| OSD534 | O sistema deve exibir dropdown "Selecionar endereco salvo" acima do campo de endereco no formulario de novo pedido |
| OSD535 | O sistema deve ordenar enderecos salvos: favoritos primeiro, depois por frequencia de uso |
| OSD536 | O sistema deve preencher todos os campos de endereco e coordenadas ao selecionar um endereco salvo |
| OSD537 | O sistema deve permitir busca textual nos enderecos salvos por label ou endereco |
| OSD538 | O sistema deve exibir badge com contagem de uso em cada endereco salvo (ex: "Usado 15 vezes") |

---

## Gestao de Enderecos (CRUD)

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD540 | O sistema deve fornecer tela "Meus Enderecos" no app lojista e na Central |
| OSD541 | O sistema deve permitir criar endereco com autocomplete + pin drop integrados |
| OSD542 | O sistema deve permitir editar endereco salvo (label, endereco, complemento, referencia) |
| OSD543 | O sistema deve permitir excluir endereco salvo com confirmacao |
| OSD544 | O sistema deve permitir ordenar enderecos por: mais usados, recentes, alfabetico |
| OSD545 | O sistema deve exibir preview no mapa ao visualizar um endereco salvo |

---

## CRUD Lojas (Completude)

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD550 | O sistema deve exibir lista de lojas com: avatar/logo, nome, telefone, endereco, status badge, total pedidos, data do ultimo pedido |
| OSD551 | O sistema deve permitir filtrar lojas por status (ativo/inativo) e busca por nome |
| OSD552 | O sistema deve fornecer tela de detalhes da loja com dados cadastrais, mapa de localizacao e resumo de atividade |
| OSD553 | O sistema deve exibir historico de pedidos dos ultimos 30 dias na tela de detalhes da loja |
| OSD554 | O sistema deve exibir resumo financeiro da loja: total faturado, pendente, ultimo pagamento |
| OSD555 | O sistema deve permitir editar dados da loja: nome fantasia, telefone, endereco (com autocomplete), nome do contato |
| OSD556 | O sistema deve permitir desativar/reativar loja com confirmacao ("Desativar loja X? Pedidos em andamento serao mantidos.") |
| OSD557 | O sistema deve usar o componente de autocomplete de enderecos no formulario de edicao de loja |

---

## CRUD Motoboys (Completude)

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD570 | O sistema deve exibir lista de motoboys com: foto, nome, status badge (online/offline/busy), telefone, total entregas |
| OSD571 | O sistema deve permitir filtrar motoboys por status (online/offline/busy), ativo/inativo e busca por nome |
| OSD572 | O sistema deve fornecer tela de detalhes do motoboy com dados pessoais, localizacao atual (se online) e metricas |
| OSD573 | O sistema deve exibir metricas do motoboy: entregas hoje, entregas mes, tempo medio, taxa de conclusao |
| OSD574 | O sistema deve exibir historico de entregas dos ultimos 30 dias na tela de detalhes do motoboy |
| OSD575 | O sistema deve exibir earnings acumulados do motoboy com periodo selecionavel |
| OSD576 | O sistema deve permitir editar dados do motoboy: nome, telefone, tipo de veiculo, placa |
| OSD577 | O sistema deve permitir desativar/reativar motoboy com confirmacao |
| OSD578 | O sistema deve exibir mapa pequeno com localizacao dos motoboys ativos na listagem |

---

## Tracking Motoboy (Fix + Diagnostico)

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD590 | O sistema deve exibir badge de qualidade GPS ao lado de cada motoboy na Central: verde (< 1 min), amarelo (1-5 min), vermelho (> 5 min), cinza (permissao negada) |
| OSD591 | O sistema deve exibir banner persistente vermelho no app motoboy quando GPS esta desativado ou permissao negada: "Ative sua localizacao para receber entregas" |
| OSD592 | O sistema deve enviar localizacao imediatamente quando motoboy muda status para "online", sem esperar o intervalo padrao |
| OSD593 | O sistema deve usar intervalo de 15 segundos para atualizacao de GPS quando motoboy esta "online" ou "busy" |
| OSD594 | O sistema deve remover marcadores de motoboys cuja ultima localizacao e superior a 10 minutos (stale marker cleanup) |
| OSD595 | O sistema deve reajustar bounds do mapa automaticamente quando novos motoboys ficam online (auto-fit) |

---

## Quality Pass — Central

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD610 | O sistema deve exibir no dashboard cards "Hoje" com metricas em tempo real: entregas do dia, motoboys online agora, pedidos pendentes |
| OSD611 | O sistema deve exibir timeline visual do pedido com status e timestamps (ex: Pendente 10:00 → Atribuido 10:05 → Coletado 10:20 → Entregue 10:45) |
| OSD612 | O sistema deve permitir selecao multipla de pedidos pendentes para atribuicao em lote ao mesmo motoboy (bulk assign) |

---

## Quality Pass — Lojista

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD625 | O sistema deve exibir estimativa de custo da entrega antes de confirmar o pedido, baseada na pricing table ativa |
| OSD626 | O sistema deve permitir filtrar historico de pedidos por data, status e valor |
| OSD627 | O sistema deve exibir tela de detalhes da entrega com: timeline visual, nome e foto do motoboy, POD (se houver) |

---

## Quality Pass — Motoboy

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD645 | O sistema deve exibir botao "Navegar" na entrega ativa que abre Google Maps ou Waze com o endereco de destino preenchido |
| OSD646 | O sistema deve emitir notificacao sonora e vibracao (Notification API + navigator.vibrate) quando uma nova entrega for atribuida |
| OSD647 | O sistema deve exibir distancia estimada e valor estimado antes do motoboy aceitar a entrega |
| OSD648 | O sistema deve exibir contexto visual na pagina de status: "Voce esta online — N entregas disponiveis na regiao" |

---

## Matriz de Permissoes (Wave 5)

| Funcionalidade | operator | shop | courier |
|----------------|----------|------|---------|
| Autocomplete enderecos | Sim | Sim | - |
| CRUD enderecos salvos | Sim (todas lojas) | Sim (proprios) | - |
| Ver detalhes loja | Sim | Proprio | - |
| Editar loja | Sim | - | - |
| Desativar loja | Sim | - | - |
| Ver detalhes motoboy | Sim | - | Proprio |
| Editar motoboy | Sim | - | - |
| Desativar motoboy | Sim | - | - |
| Bulk assign pedidos | Sim | - | - |
| Ver estimativa custo | Sim | Sim | Sim |
| Ver timeline pedido | Sim | Sim (proprios) | Sim (proprios) |
| Navegar para endereco | - | - | Sim |

---

## Rastreabilidade

| Modulo | Requisitos |
|--------|------------|
| Geocoding e Autocomplete | OSD501-OSD512, RNF501-RNF503 |
| Enderecos Salvos | OSD530-OSD538 |
| Gestao de Enderecos | OSD540-OSD545 |
| CRUD Lojas | OSD550-OSD557 |
| CRUD Motoboys | OSD570-OSD578 |
| Tracking Motoboy | OSD590-OSD595 |
| Quality Pass Central | OSD610-OSD612 |
| Quality Pass Lojista | OSD625-OSD627 |
| Quality Pass Motoboy | OSD645-OSD648 |
