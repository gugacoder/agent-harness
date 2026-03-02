# Brainstorming Wave 5 — Chega.la

**Data**: 2026-03-02
**Foco**: Enderecos Inteligentes, Completude das Interfaces, Usabilidade Real, Tracking de Motoboy
**Base**: Wave-4 (seguranca, login, perfil resolvidos) → agora foco em operacao real
**Tema**: Operacao Real — o app funciona de verdade no dia a dia?

---

## 1. Contexto — O que mudou desde a wave 4

### 1.1 Estado do produto (pos wave-4)

Assumindo wave-4 implementada, o Chega.la tera:
- **RBAC granular** com role-check em todas as rotas
- **Super admin** com acesso cross-company
- **Login OTP** via WhatsApp + Email
- **Gestao de perfil** com edicao e avatar crop
- **Gestao de usuarios/times** completa na Central

O produto agora tem seguranca solida e acesso moderno. Porem, a **operacao real** ainda tem gaps criticos:

| Area | Estado pos wave-4 | Gap remanescente |
|---|---|---|
| Enderecos | Digitacao 100% manual | Sem autocomplete, sem favoritos, sem geocoding |
| CRUD lojas | Criar + listar | Sem editar, sem ver detalhes, sem desativar |
| CRUD motoboys | Criar + listar + toggle status | Sem editar dados, sem ver performance detalhada |
| Mapa/tracking | GPS a cada 30s | Motoboy pode nao aparecer (diagnostico necessario) |
| Telas | Funcionalidades basicas | Gaps de UI, fluxos incompletos, campos faltantes |
| Endereço do pedido | Texto livre | Sem validacao, sem lat/lng real, sem normalizacao |

**Conclusao**: O produto funciona em demo, mas nao em producao real. Um lojista que precisa criar 30 pedidos/dia nao vai digitar 30 enderecos completos. Um operador que nao consegue editar dados de uma loja vai desistir. Estas sao falhas de **completude operacional**.

### 1.2 Mercado em 2026 — Enderecos e Usabilidade

**Tendencias de enderecamento em delivery 2026:**

- **Autocomplete e padrao absoluto**: Google Places, Mapbox, HERE, OpenStreetMap/Nominatim. Nenhum app de delivery relevante obriga digitacao completa.
- **Enderecos salvos**: iFood, Rappi, 99, Lalamove salvam enderecos recentes e permitem favoritos. "Casa", "Trabalho", "Loja X" com um toque.
- **Pin drop**: Selecionar ponto no mapa e arrastar o pin. Essencial para enderecos sem numero ou em areas rurais.
- **Geocoding reverso**: Tocar no mapa → obter endereco. Essencial para validar coordenadas.
- **Validacao em tempo real**: Conforme usuario digita, sistema sugere, usuario seleciona, coordenadas preenchidas automaticamente.

**Custo de geocoding:**
- **Google Places API**: USD 2.83 / 1000 requests (Autocomplete) + USD 5.00 / 1000 (Place Details). Caro para alto volume.
- **Mapbox Geocoding**: USD 0.75 / 1000 requests. Mais acessivel.
- **Nominatim (OSM)**: Gratuito se self-hosted. Rate limit de 1 req/s no servico publico.
- **HERE Geocoding**: 250K requests/mes gratis. Depois USD 1.00 / 1000.
- **ViaCEP**: Gratuito. Autocomplete por CEP (somente Brasil). Sem geocoding.
- **BrasilAPI**: Gratuito. CEP + CNPJ + outros dados brasileiros.

**Recomendacao para Chega.la**: Stack hibrida:
1. **ViaCEP / BrasilAPI** para preenchimento automatico por CEP (gratuito, rapido)
2. **Nominatim self-hosted** ou **HERE (free tier)** para geocoding (coordenadas a partir de endereco)
3. **Leaflet** (ja instalado) para pin drop e mapa interativo

**Referencia competitiva — Enderecos:**

| App | Autocomplete | Favoritos | Pin drop | Enderecos recentes | Geocoding |
|---|---|---|---|---|---|
| **iFood** | Google Places | Sim (casa, trabalho, +) | Sim | Sim (ultimos 10) | Google |
| **Rappi** | Google Places | Sim | Sim | Sim | Google |
| **Loggi** | Google Places | Sim (enderecos salvos) | Nao | Sim | Google |
| **99Entrega** | Google Places | Sim | Sim | Sim | Google |
| **Lalamove** | Google Places | Sim (enderecos frequentes) | Sim | Sim | Google |
| **Entregas Expressas** | Nao claro | Nao claro | Nao | Nao | Nao claro |
| **Chega.la (atual)** | Nao | Nao | Nao | Nao | Nao |

**Gap critico**: O Chega.la e o unico app que exige digitacao 100% manual de enderecos. Ate o concorrente direto (Entregas Expressas) parece ter alguma forma de autopreenchimento. Este gap sozinho pode definir se um lojista adota ou abandona o sistema.

**Referencia competitiva — Completude de interfaces:**

| App | CRUD lojas | CRUD motoboys | Detalhes de entrega | Historico completo |
|---|---|---|---|---|
| **iFood** | Completo (portal web) | Completo (app entregador) | Timeline detalhada | Sim + filtros + export |
| **Entregas Expressas** | Cadastro + edicao + import | Cadastro + edicao + documentos | Timeline + mapa + POD | Sim + relatorios |
| **SyLog** | Completo | Completo + CNH + bloqueio | Timeline + assinatura | Sim + export |
| **Chega.la (atual)** | Criar + listar | Criar + listar + status | Status basico | Lista simples |

---

## 2. Novas dores identificadas (Wave 5)

### 2.1 Enderecos

**D-035 | Endereco 100% manual — lentidao e erros** (Score: 9)
O formulario de nova entrega (NovaEntregaPage no lojista) exige digitacao completa do endereco de destino: rua, numero, bairro, cidade, estado, CEP. Nenhum autocomplete, nenhum preenchimento por CEP, nenhuma sugestao. Em 2026, isso e inaceitavel. Um lojista que cria 30 pedidos/dia perde ~2 minutos por endereco = 1 hora/dia so digitando enderecos. Alem disso, erros de digitacao geram entregas no endereco errado (D-006 da wave-1, parcialmente resolvido por validacao Zod mas nao por autocomplete).
- **Impacto**: Critico. Atrito operacional diario. Causa direta de erro e lentidao.
- **Referencia**: Google Places API, Nominatim, HERE.

**D-036 | Sem enderecos salvos — repeticao desnecessaria** (Score: 8)
Lojistas frequentemente entregam para os mesmos destinos (clientes regulares, filiais, escritorios). Hoje, o lojista digita o mesmo endereco toda vez. Sem historico de enderecos recentes, sem favoritos, sem "endereco salvo". iFood salva os ultimos 10 enderecos. Rappi permite criar favoritos ("Casa do cliente X"). O Chega.la nao salva nada.
- **Impacto**: Alto. Repeticao desnecessaria a cada pedido. Frustracao cumulativa.

**D-037 | Sem geocoding — coordenadas invalidas** (Score: 8)
O formulario de pedidos aceita `delivery_lat` e `delivery_lng` como "0" (valor default no NovaEntregaPage). O mapa da Central e do lojista mostra pontos em lat=0, lng=0 (no Golfo da Guine, Africa). Sem geocoding, o sistema nao sabe ONDE a entrega deve ser feita. O motoboy recebe um endereco de texto sem coordenadas reais. O tracking no mapa fica inutilizado para a entrega.
- **Impacto**: Alto. O mapa de entregas e inutil sem coordenadas reais.

**D-038 | Sem gestao de enderecos — nenhum CRUD** (Score: 7)
Nao existe entidade "endereco" no sistema. Enderecos sao campos de texto nos pedidos e nas lojas. Nao ha como pre-cadastrar enderecos, criar uma lista de locais frequentes, ou organizar enderecos por categoria. Concorrentes como Lalamove e 99Entrega permitem "Meus enderecos" com nome amigavel ("Filial Centro", "Deposito").
- **Impacto**: Medio. Feature de conveniencia que se torna necessidade em uso intenso.

**D-039 | Sem pin drop — enderecos sem numero** (Score: 7)
Em muitas cidades brasileiras, enderecos sao imprecisos ("ao lado do mercado", "depois da igreja"). Sem a opcao de selecionar um ponto no mapa (pin drop), o lojista nao consegue indicar com precisao onde entregar. O motoboy recebe um endereco textual vago. iFood, Rappi e Lalamove permitem arrastar o pin no mapa para ajustar a localizacao exata.
- **Impacto**: Medio-alto. Essencial para entregas em areas com enderecamento precario.

### 2.2 Completude de interfaces

**D-040 | CRUD de lojas incompleto** (Score: 8)
A tela LojistasPage na Central lista lojas com dados basicos. Falta: editar dados da loja (nome, telefone, endereco), ver detalhes completos (historico de pedidos, faturamento, performance), desativar/reativar loja, adicionar notas. O operador que precisa corrigir o endereco de uma loja precisa ir ao banco de dados. Em producao real com 20+ lojas, isso e insustentavel.
- **Impacto**: Alto. Gestao de lojas e operacao diaria do operador.

**D-041 | CRUD de motoboys incompleto** (Score: 8)
A tela MotoboysPage na Central lista motoboys com nome, status e toggle ativo/inativo. Falta: editar dados (nome, telefone, veiculo, placa), ver detalhes (historico de entregas, earnings, performance, localizacao atual), ver documentos (CNH, foto), metricas individuais (tempo medio, taxa de conclusao, rating). O operador nao consegue avaliar a performance de um motoboy especifico sem cruzar multiplas telas.
- **Impacto**: Alto. Gestao de frota e operacao diaria.

**D-042 | Motoboy nao aparece no mapa — diagnostico** (Score: 8)
Usuarios reportam que motoboys nao aparecem no mapa da Central. Possiveis causas:
1. Motoboy com status "offline" — GPS so envia quando "online" ou "busy"
2. Permissao de geolocalizacao negada no navegador/dispositivo
3. Hook `useLocationSharing` com intervalo de 30s — se motoboy acabou de ficar online, demora ate 30s
4. SSE desconectado — heartbeat de 30s, reconexao com exponential backoff
5. Motoboy com lat/lng antigos (ultima localizacao > 5 min)
6. Mapa com bounds que nao incluem a posicao do motoboy

Este nao e um bug unico, e uma combinacao de fatores que resulta numa experiencia frustrante para o operador que "nao ve o motoboy". Precisa de diagnostico e fix sistematico.
- **Impacto**: Alto. Feature core (mapa real-time) nao funciona confiavelmente.

**D-043 | Interfaces incompletas para operacao real** (Score: 8)
Analise de completude por app revela gaps:

**Central**:
- Dashboard sem metricas de hoje (entregas do dia, motoboys ativos agora, pedidos pendentes agora)
- Detalhes de pedido sem timeline visual (so status atual)
- Sem bulk actions (atribuir multiplos pedidos, notificar todos os motoboys)
- Configuracao limitada (apenas POD, closing period, invoice period)

**Lojista**:
- Nova entrega sem validacao de horario (pode criar pedido as 3am quando nao ha motoboy)
- Sem estimativa de custo antes de confirmar pedido
- Historico sem filtros (data, status, valor)
- Sem detalhes da entrega (timeline, POD, motoboy designado)

**Motoboy**:
- Sem navegacao para endereco (botao "abrir no Google Maps/Waze")
- Sem notificacao sonora/vibracao para nova entrega
- Sem indicacao de distancia/valor antes de aceitar
- Status page sem contexto (por que ficar "online"? quantas entregas disponiveis?)

- **Impacto**: Alto cumulativo. Cada gap isolado e pequeno, mas juntos definem a diferenca entre "demo" e "producao".

---

## 3. Novos ganhos identificados (Wave 5)

### 3.1 Enderecos

**G-030 | Autocomplete de enderecos com geocoding** (Score: 9)
Stack hibrida de geocoding:

**Camada 1 — CEP (gratis)**:
- Integracao ViaCEP / BrasilAPI
- Usuario digita CEP → rua, bairro, cidade, estado preenchidos automaticamente
- Excelente para enderecos residenciais brasileiros

**Camada 2 — Busca textual (gratis/low cost)**:
- Nominatim (self-hosted ou free tier) ou HERE Geocoding (250K/mes gratis)
- Usuario digita parte do endereco → sugestoes em dropdown
- Selecionar sugestao → lat/lng preenchidos automaticamente
- Debounce de 300ms para evitar requisicoes excessivas

**Camada 3 — Pin drop (gratis, usa Leaflet existente)**:
- Mapa interativo com marcador arrastavel
- Tocar no mapa → geocoding reverso → endereco preenchido
- Arrastar pin → coordenadas atualizadas
- Ideal para enderecos imprecisos ou areas rurais

**UX do autocomplete**:
```
[Campo endereco] → usuario digita "Av Pauli..."
  → dropdown com sugestoes:
    📍 Av. Paulista, 1000 - Bela Vista, SP
    📍 Av. Paulista, 2300 - Cerqueira César, SP
    📍 Av. Paulo VI, 100 - Pinheiros, SP
  → usuario seleciona → campos preenchidos + mapa centralizado
```

- **Referencia**: ViaCEP API, BrasilAPI, Nominatim, HERE Geocoding, Leaflet marker dragging.

**G-031 | Enderecos salvos e favoritos** (Score: 8)
Nova entidade `saved_addresses`:
```
id, company_id, profile_id, label, address, lat, lng, complement, reference
is_favorite, use_count, last_used_at, created_at, updated_at
```

Funcionalidades:
- **Enderecos recentes**: ultimos 10 enderecos usados (por lojista), auto-salvos apos cada pedido
- **Favoritos**: marcar endereco como favorito (estrela). Aparecem no topo da lista
- **Labels**: "Casa", "Trabalho", "Filial Centro", "Cliente X"
- **Busca**: pesquisar nos enderecos salvos por label ou endereco
- **Selecao rapida**: ao criar pedido, dropdown "Selecionar endereco salvo" acima do campo de endereco

Fluxo de criacao de pedido:
```
[Selecionar endereco salvo ▼] → dropdown com favoritos + recentes
  ⭐ Filial Centro — Av. Paulista, 1000
  ⭐ Deposito — Rua Augusta, 500
  🕒 Rua Oscar Freire, 300 (usado ontem)
  🕒 Av. Reboucas, 1500 (usado ha 3 dias)
  ─────────────────
  ✏️ Digitar novo endereco
```

- **Referencia**: iFood endereco salvo, Rappi favoritos, Lalamove "My Addresses".

**G-032 | Gestao de enderecos (CRUD)** (Score: 7)
Tela "Meus Enderecos" no app lojista e na Central:
- Listar todos os enderecos salvos com label, endereco, badge favorito
- Criar novo endereco (formulario com autocomplete + pin drop)
- Editar endereco existente
- Excluir endereco
- Marcar/desmarcar favorito
- Ordenar por: mais usados, recentes, alfabetico

- **Referencia**: iFood "Meus enderecos", Uber "Saved Places".

### 3.2 Completude

**G-033 | CRUD completo de lojas** (Score: 8)
Evolucao da LojistasPage na Central:

**Lista**:
- Card/row com: logo/avatar, nome, telefone, endereco, status badge, total pedidos, ultimo pedido
- Filtros: status (ativo/inativo), busca por nome
- Acoes inline: editar, desativar, ver detalhes

**Detalhes da loja** (nova tela):
- Dados cadastrais editaveis
- Mapa com pin da localizacao
- Historico de pedidos (ultimos 30 dias)
- Resumo financeiro (total faturado, pendente, ultimo pagamento)
- Acoes: editar dados, desativar/reativar, ver faturas

**Editar loja** (drawer/modal):
- Nome fantasia, telefone, endereco (com autocomplete), horario de funcionamento
- Contato responsavel
- Salvar com validacao

**G-034 | CRUD completo de motoboys** (Score: 8)
Evolucao da MotoboysPage na Central:

**Lista**:
- Card/row com: foto, nome, status badge (online/offline/busy), telefone, total entregas, rating
- Filtros: status (online/offline/busy), ativo/inativo, busca por nome
- Mapa pequeno mostrando localizacao dos motoboys ativos
- Acoes inline: ver detalhes, editar, desativar

**Detalhes do motoboy** (nova tela):
- Dados pessoais editaveis (nome, telefone, veiculo, placa)
- Foto/avatar
- Localizacao atual no mapa (se online)
- Metricas: entregas hoje, entregas mes, tempo medio, taxa de conclusao, km percorridos
- Historico de entregas (ultimas 30 dias)
- Earnings acumulados (periodo selecionavel)
- Timeline de status (quando ficou online, offline, busy)
- Acoes: editar, desativar/reativar, resetar senha

**G-035 | Fix tracking motoboy + diagnostico visual** (Score: 8)
Solucoes para D-042:

1. **Indicador de status GPS na Central**: badge ao lado do motoboy indicando qualidade do sinal GPS
   - 🟢 GPS ativo (localizacao < 1 min)
   - 🟡 GPS intermitente (localizacao 1-5 min)
   - 🔴 GPS inativo (> 5 min sem localizacao)
   - ⚫ Permissao negada

2. **Alerta no app motoboy**: se GPS desativado ou permissao negada, banner persistente vermelho no topo do app: "Ative sua localizacao para receber entregas"

3. **Forcar atualizacao ao ficar online**: quando motoboy muda status para "online", enviar localizacao imediatamente (nao esperar o intervalo de 30s)

4. **Reduzir intervalo quando online sem entrega**: de 30s para 15s quando "online", manter 15s quando "busy" (em entrega)

5. **Stale marker cleanup**: na Central, remover marcadores de motoboys cuja ultima localizacao e > 10 min (provavelmente offline mas nao atualizaram status)

6. **Auto-fit map**: quando novos motoboys entram, reajustar bounds do mapa para incluir todos

**G-036 | Completude das interfaces — Quality Pass** (Score: 8)
Itens especificos por app:

**Central**:
- Dashboard: cards "Hoje" com metricas em tempo real (entregas do dia, motoboys online agora, pedidos pendentes)
- Pedidos: timeline visual do pedido (status → status → status com timestamps)
- Pedidos: bulk assign (selecionar multiplos pedidos, atribuir ao mesmo motoboy)

**Lojista**:
- Nova entrega: estimativa de custo antes de confirmar (baseado na pricing table ativa)
- Nova entrega: campo de horario preferido (manha, tarde, agora)
- Historico: filtros por data, status, valor
- Detalhes da entrega: timeline visual, nome do motoboy, foto, POD

**Motoboy**:
- Entrega ativa: botao "Navegar" que abre Google Maps/Waze com destino preenchido
- Nova entrega: notificacao sonora + vibracao (via Notification API + vibrate)
- Aceitar entrega: mostrar distancia estimada e valor estimado ANTES de aceitar
- Status page: contexto visual ("Voce esta online — 3 entregas disponiveis na regiao")

---

## 4. Alivios e Criadores de Ganho

### 4.1 Alivios

| Dor | Alivio |
|---|---|
| D-035 (endereco manual) | Autocomplete por CEP (ViaCEP) + busca textual (Nominatim/HERE) + pin drop (Leaflet). |
| D-036 (sem enderecos salvos) | Entidade saved_addresses. Auto-save apos cada pedido. Favoritos com label. |
| D-037 (sem geocoding) | Geocoding automatico ao selecionar endereco. Lat/lng reais em cada pedido. |
| D-038 (sem gestao enderecos) | Tela "Meus Enderecos" com CRUD completo. |
| D-039 (sem pin drop) | Marcador arrastavel no mapa Leaflet. Geocoding reverso ao soltar pin. |
| D-040 (CRUD lojas incompleto) | Lista + detalhes + editar + desativar. Historico e financeiro por loja. |
| D-041 (CRUD motoboys incompleto) | Lista + detalhes + editar + metricas + historico + earnings. |
| D-042 (motoboy nao aparece mapa) | Diagnostico + indicador GPS + forcar update ao ficar online + stale cleanup. |
| D-043 (interfaces incompletas) | Quality pass por app: timeline, estimativas, filtros, navegacao, notificacoes. |

### 4.2 Criadores de Ganho

| Ganho | Criador |
|---|---|
| G-030 (autocomplete) | Stack hibrida gratis/low-cost: ViaCEP + Nominatim + Leaflet. UX com dropdown fluido. |
| G-031 (enderecos salvos) | Selecao rapida no topo do formulario. Favoritos com estrela. Recentes auto-salvos. |
| G-032 (gestao enderecos) | Tela CRUD com autocomplete integrado. Mapa de preview. |
| G-033 (CRUD lojas) | Detalhes com historico + financeiro. Edicao inline. Status management. |
| G-034 (CRUD motoboys) | Ficha completa: metricas, earnings, mapa, timeline de status. |
| G-035 (fix tracking) | Badge de qualidade GPS. Banner de alerta. Update imediato ao ficar online. |
| G-036 (quality pass) | Timeline visual. Estimativa de custo. Navegacao externa. Notificacao sonora. |

---

## 5. Analise de concorrentes — Detalhamento Wave 5

### 5.1 iFood — Enderecos

**Experiencia de endereco do restaurante:**
- Cadastro inicial: Google Places autocomplete. Digitar nome do restaurante ou endereco → selecionar da lista → mapa com pin ajustavel
- "Raio de entrega": circulo no mapa definindo area de cobertura
- Endereco salvo com complemento e ponto de referencia

**Experiencia do consumidor:**
- "Meus enderecos": lista com favoritos (casa, trabalho) + recentes
- Adicionar endereco: autocomplete + mapa com pin
- Um toque para selecionar endereco salvo ao fazer pedido

**O que aprender**: A busca por endereco e o PRIMEIRO passo de qualquer pedido. Se for dificil, o usuario desiste antes de comecar. iFood investiu pesado nisso.

### 5.2 Lalamove — Enderecos e Operacao

**Endereco de coleta/entrega:**
- Dois campos: "Coleta" e "Entrega"
- Autocomplete integrado (Google Places)
- Mapa com rota desenhada entre os dois pontos
- Estimativa de distancia + preco ANTES de confirmar
- "Adicionar parada" para multi-stop

**Enderecos salvos:**
- "My Addresses": lista com label, endereco, icone (casa, empresa, favorito)
- Criar/editar/excluir
- Selecao rapida ao criar pedido

**O que aprender**: Mostrar rota + estimativa de custo ANTES de confirmar e poderoso. O lojista sabe exatamente o que vai pagar. Transparencia gera confianca.

### 5.3 99Entrega — Simplicidade

**Endereco:**
- Campo unico com autocomplete
- Resultados mistos: enderecos + pontos de interesse
- Mapa com pin arrastavel
- Geocoding reverso ao mover pin

**O que aprender**: Campo unico (nao separar rua, bairro, cidade). O autocomplete faz o trabalho. Menos campos = menos atrito.

### 5.4 Entregas Expressas — Concorrente direto

**Cadastro de enderecos:**
- Importacao via planilha (CSV) para cadastro em massa
- Autopreenchimento por CEP
- Sem Google Places (custo)

**Gestao de clientes/lojas:**
- CRUD completo com historico
- Import/export
- Categorias e tags

**Gestao de motoboys:**
- Cadastro com documentos (CNH, foto, veiculo)
- Ranking de performance
- Bloqueio por inadimplencia
- Historico detalhado

**O que aprender**: Import via CSV e valioso para empresas que ja tem cadastro. CEP-based autocomplete e custo-efetivo. Ranking de motoboys motiva performance.

---

## 6. Priorizacao Wave 5

### 6.1 Tier 1 — Critico (Score 8-9): DEVE estar na Wave 5

| Prioridade | O que | Score | Justificativa |
|---|---|---|---|
| 1 | **Autocomplete + geocoding** (D-035/D-037/G-030): stack hibrida com ViaCEP + Nominatim + pin drop | 9 | Atrito #1 do lojista. Sem isso, app e inutilizavel em escala. |
| 2 | **Enderecos salvos + favoritos** (D-036/G-031): auto-save + favoritos + selecao rapida | 8 | Elimina repeticao diaria. ROI imediato para lojistas de alto volume. |
| 3 | **CRUD completo lojas** (D-040/G-033): detalhes + editar + desativar + historico | 8 | Gestao de lojas e operacao diaria. Sem CRUD, nao e gestao. |
| 4 | **CRUD completo motoboys** (D-041/G-034): detalhes + metricas + editar + historico | 8 | Gestao de frota exige ficha completa por motoboy. |
| 5 | **Fix tracking motoboy** (D-042/G-035): diagnostico + indicadores + fix sistematico | 8 | Feature core quebrada. Mapa e a vitrine do produto. |
| 6 | **Quality pass interfaces** (D-043/G-036): timeline, estimativas, filtros, navegacao | 8 | Diferenca entre demo e producao. Cumulativo. |

### 6.2 Tier 2 — Importante (Score 7): Deve estar se possivel

| Prioridade | O que | Score | Justificativa |
|---|---|---|---|
| 7 | **Gestao de enderecos** (D-038/G-032): CRUD completo de enderecos salvos | 7 | Conveniencia que vira necessidade em uso intenso. |
| 8 | **Pin drop** (D-039): selecao via mapa com geocoding reverso | 7 | Essencial para enderecos imprecisos. Brasil tem muitas areas assim. |

### 6.3 Impacto por perfil

| Perfil | Impacto na Wave 5 |
|---|---|
| Lojista | Critico — autocomplete + favoritos + estimativa de custo = operacao real |
| Operador | Alto — CRUD completo de lojas e motoboys, mapa confiavel |
| Motoboy | Alto — navegacao externa, notificacoes, info antes de aceitar |
| Empresario | Alto — mapa funcionando, interfaces completas, produto vendavel |

---

## 7. Requisito transversal: UX/CX superior

### Autocomplete de enderecos
- **Debounce 300ms**: nao buscar a cada tecla, esperar pausa
- **Highlight do match**: texto digitado em negrito nas sugestoes
- **Icone de tipo**: casa, loja, rua, ponto de interesse
- **Loading state**: spinner sutil durante busca
- **Empty state**: "Nenhum endereco encontrado. Tente o CEP ou selecione no mapa."
- **Transicao suave**: dropdown aparece com fade/slide, nao pop bruto
- **Teclado mobile**: nao fechar teclado ao mostrar sugestoes
- **Acessibilidade**: navegacao por setas, Enter para selecionar, Esc para fechar

### Pin drop
- **Animacao do pin**: pin "cai" com bounce ao soltar
- **Geocoding reverso em tempo real**: conforme arrasta, endereco atualiza (debounce)
- **Zoom automatico**: ao selecionar sugestao, zoom para rua (level 17)
- **Marcador customizado**: icone do Chega.la (azul #1dace7)
- **Instrucao visual**: "Arraste o pin para ajustar a localizacao"

### Enderecos salvos
- **Selecao com um toque**: tap no endereco salvo preenche tudo
- **Swipe para excluir**: gesto natural em mobile
- **Estrela para favoritar**: toggle com animacao
- **Badge de uso**: "Usado 15 vezes" para enderecos frequentes
- **Ordenacao inteligente**: favoritos primeiro, depois por frequencia de uso

### CRUD
- **Skeleton loading**: nao tela em branco
- **Optimistic updates**: feedback imediato, revert se erro
- **Pull to refresh**: gesto natural em mobile
- **Empty state educativo**: "Nenhuma loja cadastrada. Convide seu primeiro lojista!"
- **Confirmacao para destrutivos**: "Desativar loja X? Pedidos em andamento serao mantidos."

---

## 8. Fontes de pesquisa — Wave 5

### Geocoding e enderecos
- [ViaCEP — API de CEPs](https://viacep.com.br/)
- [BrasilAPI — CEP + CNPJ](https://brasilapi.com.br/)
- [Nominatim — OpenStreetMap Geocoding](https://nominatim.org/)
- [HERE Geocoding API](https://developer.here.com/documentation/geocoding-search-api/)
- [Mapbox Geocoding](https://docs.mapbox.com/api/search/geocoding/)
- [Google Places API — Pricing](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Leaflet — Draggable Markers](https://leafletjs.com/reference.html#marker)

### Concorrentes — enderecos
- [iFood — Ajuda enderecos](https://ajuda.ifood.com.br/)
- [Lalamove — My Addresses](https://www.lalamove.com/pt-br/)
- [Rappi — Como funciona](https://www.rappi.com.br/)
- [99 — 99Entrega](https://99app.com/entrega/)

### UX patterns
- [Material Design — Text Fields with suggestions](https://m3.material.io/)
- [Apple HIG — Search and autocomplete](https://developer.apple.com/design/human-interface-guidelines/)
- [Smashing Magazine — Designing Perfect Autocomplete](https://www.smashingmagazine.com/2022/09/auto-complete-design/)

### Completude
- [Entregas Expressas — Features](https://entregasexpressas.com.br)
- [SyLog — GR Express](https://www.sylog.com.br/gr-exp-gestao-entregas-rapidas)
- [GestaoClick — Empresa de motoboy](https://gestaoclick.com.br/programa-para-empresa-de-moto-boy/)
