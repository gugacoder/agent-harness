# Chega.la - User Stories Wave 2

Historias de usuario para a Wave 2 do Chega.la — modulo financeiro, Proof of Delivery, faturamento do lojista e dashboard analitico. Incremental sobre Wave 1.

---

## Operador (Gestor da Empresa de Entregas)

### US060 - Configurar tabela de precos

**Como** operador da empresa de entregas
**Quero** configurar tabelas de preco com regras por km, faixa de distancia, bairro ou taxa fixa
**Para** que o sistema calcule automaticamente o valor de cada entrega

**Criterios de Aceite:**
- [ ] Formulario permite criar nova tabela de preco com nome
- [ ] Cada tabela suporta multiplas regras (por km, por faixa, por bairro, taxa fixa)
- [ ] Regra por km: configurar valor base + valor por km adicional
- [ ] Regra por faixa: configurar faixas de distancia com valor para cada faixa
- [ ] Regra por bairro: associar valor fixo a bairros especificos
- [ ] Surcharges configuraveis: taxa de chuva, horario noturno (% ou valor fixo)
- [ ] Exatamente uma tabela ativa por vez (ao ativar uma, a anterior desativa)
- [ ] Possibilidade de associar tabela especifica a um lojista (override)
- [ ] Preview de calculo: simular valor para distancia X antes de ativar

**Requisitos:** OSD200, OSD201, OSD202, OSD203, OSD204, OSD205, OSD206, OSD208

---

### US061 - Gerar fechamento financeiro de motoboy

**Como** operador
**Quero** gerar fechamento financeiro por motoboy em um periodo selecionado
**Para** saber quanto devo pagar a cada motoboy e manter controle financeiro

**Criterios de Aceite:**
- [ ] Selecionar motoboy e periodo (dia, semana, mes, ou custom)
- [ ] Sistema calcula automaticamente: total entregas, distancia total, valor total a pagar
- [ ] Detalhamento visivel: lista de entregas com data, pedido, lojista, distancia, valor
- [ ] Fechamento criado com status "draft"
- [ ] Operador pode confirmar (draft → confirmed) e marcar pago (confirmed → paid)
- [ ] Fechamento pago e imutavel
- [ ] Evento SSE emitido ao gerar e ao pagar fechamento

**Requisitos:** OSD220, OSD221, OSD222, OSD224, OSD225, OSD226, OSD227

---

### US062 - Gerenciar fechamentos financeiros

**Como** operador
**Quero** ver lista de todos os fechamentos com filtros
**Para** acompanhar pagamentos pendentes e historico financeiro

**Criterios de Aceite:**
- [ ] Lista de fechamentos com: motoboy, periodo, total entregas, valor, status
- [ ] Filtro por motoboy, status (draft, confirmed, paid), e periodo
- [ ] Clicar no fechamento abre detalhamento completo
- [ ] Indicadores visuais de status (cores diferenciadas)
- [ ] Resumo no topo: total pendente, total pago no periodo

**Requisitos:** OSD223, OSD224

---

### US063 - Ver dashboard analitico

**Como** operador
**Quero** ver metricas detalhadas da operacao em dashboard analitico
**Para** tomar decisoes de gestao baseadas em dados

**Criterios de Aceite:**
- [ ] Metricas de volume: total entregas, concluidas, canceladas no periodo
- [ ] Taxa de conclusao como percentual
- [ ] Tempo medio de entrega (coleta → entrega)
- [ ] Performance por motoboy: entregas, tempo medio, distancia media (tabela rankeada)
- [ ] Volume por bairro em lista rankeada
- [ ] Receita total e receita media por entrega
- [ ] Grafico de tendencia: entregas por dia no periodo
- [ ] Filtro por periodo: dia, semana, mes, custom
- [ ] Dashboard separado dos contadores basicos do Wave 1 (acesso via menu lateral)

**Requisitos:** OSD300, OSD301, OSD302, OSD303, OSD304, OSD305, OSD306, OSD307

---

### US064 - Ver comprovante de entrega

**Como** operador
**Quero** ver o comprovante digital (foto + assinatura) de qualquer entrega
**Para** resolver disputas com lojistas e clientes finais

**Criterios de Aceite:**
- [ ] No detalhamento da entrega, secao "Comprovante" mostra foto, assinatura, GPS e horario
- [ ] Indicador visual no pedido quando houver comprovante (icone/badge)
- [ ] Foto ampliavel (clique para expandir)
- [ ] Coordenadas exibidas no mapa (pin no ponto de entrega real)
- [ ] Acessivel no historico de entregas

**Requisitos:** OSD284, OSD286, OSD287

---

### US065 - Gerar e gerenciar faturas de lojistas

**Como** operador
**Quero** gerar faturas periodicas para lojistas com detalhamento das entregas
**Para** profissionalizar a cobranca e eliminar controle manual

**Criterios de Aceite:**
- [ ] Selecionar lojista e periodo para gerar fatura
- [ ] Fatura gerada com: lista de entregas, valores unitarios, subtotais, total
- [ ] Status da fatura: draft, sent, paid
- [ ] Fatura draft pode ser revisada antes de enviar
- [ ] Ao enviar (draft → sent), lojista e notificado via SSE
- [ ] Marcar fatura como paga (sent → paid)
- [ ] Exportar fatura em PDF
- [ ] Lista de faturas com filtro por lojista, status, periodo

**Requisitos:** OSD260, OSD261, OSD262, OSD264, OSD265, OSD266, OSD268

---

### US066 - Configurar POD obrigatorio

**Como** operador
**Quero** configurar se o comprovante de entrega e obrigatorio ou opcional
**Para** definir o nivel de controle adequado a minha operacao

**Criterios de Aceite:**
- [ ] Toggle nas configuracoes da empresa: "POD obrigatorio"
- [ ] Quando ativado, motoboy so pode marcar "entregue" apos capturar foto e assinatura
- [ ] Quando desativado, motoboy pode marcar "entregue" sem comprovante
- [ ] Configuracao aplica para todas as entregas da empresa

**Requisitos:** OSD285

---

## Lojista (Cliente da Empresa de Entregas)

### US080 - Ver faturas e historico de cobrancas

**Como** lojista
**Quero** ver minhas faturas com detalhamento das entregas e valores
**Para** conferir cobrancas e ter controle financeiro

**Criterios de Aceite:**
- [ ] Lista de faturas com: periodo, quantidade de entregas, valor total, status
- [ ] Filtro por periodo e status
- [ ] Detalhamento da fatura: lista de entregas com data, pedido, destino, distancia, valor
- [ ] Indicadores visuais de status (pendente, paga)
- [ ] Notificacao SSE quando nova fatura for gerada

**Requisitos:** OSD263, OSD267, OSD266

---

### US081 - Exportar fatura em PDF

**Como** lojista
**Quero** exportar uma fatura em formato PDF
**Para** enviar para minha contabilidade e manter registro fiscal

**Criterios de Aceite:**
- [ ] Botao "Exportar PDF" visivel no detalhamento da fatura
- [ ] PDF contem: logo da empresa, dados do lojista, periodo, detalhamento das entregas, total
- [ ] PDF formatado profissionalmente e legivel
- [ ] Download imediato ao clicar

**Requisitos:** OSD264, RNF024

---

### US082 - Ver comprovante de entrega

**Como** lojista
**Quero** ver o comprovante digital das minhas entregas
**Para** confirmar que as entregas foram realizadas corretamente

**Criterios de Aceite:**
- [ ] No detalhamento do pedido, secao "Comprovante" exibe foto, assinatura e horario
- [ ] Foto ampliavel
- [ ] Indicador visual no pedido quando houver comprovante
- [ ] Acessivel no historico de pedidos

**Requisitos:** OSD284, OSD286, OSD287

---

## Motoboy (Entregador)

### US100 - Capturar comprovante de entrega

**Como** motoboy
**Quero** registrar foto e assinatura digital no momento da entrega
**Para** ter prova de que entreguei e me proteger contra disputas

**Criterios de Aceite:**
- [ ] Ao clicar "Entregar", tela de captura de comprovante abre
- [ ] Passo 1: capturar foto via camera do celular (nao galeria)
- [ ] Passo 2: coletar assinatura digital em canvas touch
- [ ] Passo 3: confirmar e enviar
- [ ] GPS e timestamp capturados automaticamente
- [ ] Se POD obrigatorio: nao permite pular
- [ ] Se POD opcional: botao "Pular" disponivel
- [ ] Feedback visual de upload em progresso e confirmacao de sucesso
- [ ] Foto comprimida no client antes do upload (max 1280px, qualidade 80%)

**Requisitos:** OSD280, OSD281, OSD282, OSD283, OSD285, RNF020, RNF021

---

### US101 - Ver extrato de ganhos

**Como** motoboy
**Quero** ver quanto ganhei por entrega e o total acumulado
**Para** saber minha remuneracao e conferir pagamentos

**Criterios de Aceite:**
- [ ] Tela "Extrato" acessivel no menu do app motoboy
- [ ] Lista de entregas com: data, lojista, distancia, valor ganho
- [ ] Total acumulado por dia visivel
- [ ] Total do periodo selecionado (semana, mes)
- [ ] Filtro por periodo
- [ ] Indicador de status de pagamento por fechamento (pendente, pago)
- [ ] Notificacao quando fechamento for pago

**Requisitos:** OSD240, OSD241, OSD242, OSD243, OSD244, OSD245

---

### US102 - Ver comprovante que registrou

**Como** motoboy
**Quero** ver os comprovantes que registrei no historico de entregas
**Para** conferir que foram salvos corretamente

**Criterios de Aceite:**
- [ ] No historico de entregas, indicador visual quando houver comprovante
- [ ] Clicar mostra foto, assinatura e horario do registro
- [ ] Foto ampliavel

**Requisitos:** OSD284, OSD286

---

## Rastreabilidade

| User Story | Requisitos OSD |
|------------|----------------|
| US060 | OSD200-OSD206, OSD208 |
| US061 | OSD220-OSD222, OSD224-OSD227 |
| US062 | OSD223, OSD224 |
| US063 | OSD300-OSD307 |
| US064 | OSD284, OSD286, OSD287 |
| US065 | OSD260-OSD262, OSD264-OSD266, OSD268 |
| US066 | OSD285 |
| US080 | OSD263, OSD266, OSD267 |
| US081 | OSD264, RNF024 |
| US082 | OSD284, OSD286, OSD287 |
| US100 | OSD280-OSD283, OSD285, RNF020, RNF021 |
| US101 | OSD240-OSD245 |
| US102 | OSD284, OSD286 |
