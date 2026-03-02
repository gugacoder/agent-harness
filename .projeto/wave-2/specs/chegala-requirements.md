# Chega.la - Requisitos Wave 2

Requisitos funcionais (OSD) e nao funcionais (RNF) para a Wave 2 do Chega.la — modulo financeiro (tabela de precos, fechamento, extrato motoboy, faturamento lojista), Proof of Delivery (POD) e dashboard analitico. Incremental sobre Wave 1.

---

## Escopo da Wave 2

A Wave 2 cobre os 4 temas prioritarios do ranking (12 items com score 8-9 nao implementados):

| Prioridade | Escopo | Discoveries |
|---|---|---|
| 1 | Modulo financeiro basico: tabela de precos + calculo por entrega + fechamento motoboy + extrato | D-004 (9), D-014 (9), D-018 (8), G-003 (9), G-009 (9), G-012 (8) |
| 2 | Faturamento do lojista: extrato de entregas + historico com valores | D-012 (8), G-008 (8), G-014 (8) |
| 3 | Proof of Delivery: foto + assinatura digital no app motoboy | D-017 (8), D-023 (7), G-013 (8) |
| 4 | Dashboard analitico: metricas por periodo, performance, bairros | G-004 (8) |

**Fora do escopo da Wave 2:** Dispatch inteligente (G-015), ETA lojista (D-021), link rastreamento cliente (G-016), conformidade regulatoria (D-019), IA (G-005), roteirizacao (D-005/D-016).

---

## Tabela de Precos

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD200 | O sistema deve permitir criacao de tabela de precos por empresa |
| OSD201 | O sistema deve suportar regra de precificacao por km (valor base + valor por km adicional) |
| OSD202 | O sistema deve suportar regra de precificacao por faixa de distancia (ex: 0-5km = R$X, 5-10km = R$Y) |
| OSD203 | O sistema deve suportar regra de precificacao por bairro (valor fixo mapeado a bairro) |
| OSD204 | O sistema deve suportar regra de precificacao por taxa fixa (valor unico independente da distancia) |
| OSD205 | O sistema deve suportar surcharges (taxa de chuva, horario noturno) como percentual ou valor fixo adicionado ao preco base |
| OSD206 | O sistema deve permitir multiplas tabelas de preco por empresa, com exatamente uma ativa por vez |
| OSD207 | O sistema deve calcular valor da entrega automaticamente ao criar delivery, com base na tabela ativa e distancia calculada |
| OSD208 | O sistema deve permitir associar tabela de preco especifica a um lojista (override sobre a tabela padrao da empresa) |
| OSD209 | O sistema deve registrar o valor calculado e a regra aplicada em cada entrega |
| OSD210 | O sistema deve recalcular valor se distancia real (GPS) divergir significativamente da distancia estimada |

---

## Fechamento Financeiro do Motoboy

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD220 | O sistema deve permitir gerar fechamento financeiro por motoboy em periodo selecionado (diario, semanal, mensal, ou custom) |
| OSD221 | O sistema deve calcular no fechamento: total de entregas, distancia total, valor total a pagar, valor total cobrado |
| OSD222 | O sistema deve registrar status do fechamento: draft, confirmed, paid |
| OSD223 | O sistema deve exibir lista de fechamentos com filtro por motoboy, status e periodo |
| OSD224 | O sistema deve exibir detalhamento do fechamento com lista de entregas incluidas (data, pedido, lojista, distancia, valor) |
| OSD225 | O sistema deve permitir confirmar fechamento (draft → confirmed) e marcar como pago (confirmed → paid) |
| OSD226 | O sistema deve impedir alteracao de fechamento apos status "paid" |
| OSD227 | O sistema deve notificar partes interessadas via SSE ao gerar ou pagar fechamento |

---

## Extrato do Motoboy

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD240 | O sistema deve exibir no app do motoboy o extrato de entregas realizadas com valor por entrega |
| OSD241 | O sistema deve exibir total acumulado por dia no extrato |
| OSD242 | O sistema deve exibir total acumulado por periodo selecionado (semana, mes) |
| OSD243 | O sistema deve permitir filtro por periodo no extrato do motoboy |
| OSD244 | O sistema deve exibir status de pagamento por fechamento no extrato (pendente, pago) |
| OSD245 | O sistema deve exibir detalhes de cada entrega no extrato (lojista, endereco, distancia, valor, horario) |

---

## Faturamento do Lojista

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD260 | O sistema deve permitir gerar fatura por lojista em periodo selecionado (diario, semanal, mensal, ou custom) |
| OSD261 | O sistema deve detalhar na fatura: data, numero do pedido, endereco de coleta, endereco de entrega, distancia, valor unitario |
| OSD262 | O sistema deve calcular na fatura: quantidade de entregas, distancia total, valor total |
| OSD263 | O sistema deve exibir fatura no app do lojista |
| OSD264 | O sistema deve permitir exportacao de fatura em PDF |
| OSD265 | O sistema deve registrar status da fatura: draft, sent, paid |
| OSD266 | O sistema deve notificar lojista via SSE quando nova fatura for gerada ou status mudar |
| OSD267 | O sistema deve exibir historico de faturas no app do lojista com filtro por periodo e status |
| OSD268 | O sistema deve impedir alteracao de fatura apos status "paid" |

---

## Proof of Delivery (POD)

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD280 | O sistema deve permitir captura de foto via camera do celular no momento da entrega |
| OSD281 | O sistema deve permitir coleta de assinatura digital (canvas touch) no momento da entrega |
| OSD282 | O sistema deve registrar coordenadas GPS e timestamp no momento da captura do comprovante |
| OSD283 | O sistema deve armazenar foto e assinatura no Supabase Storage vinculados a entrega |
| OSD284 | O sistema deve exibir comprovante (foto, assinatura, GPS, horario) no detalhamento da entrega para todos os perfis |
| OSD285 | O sistema deve permitir configuracao por empresa: POD obrigatorio ou opcional para marcar "entregue" |
| OSD286 | O sistema deve permitir consulta de comprovantes no historico de entregas (empresa, lojista, motoboy) |
| OSD287 | O sistema deve exibir indicador visual no pedido quando houver comprovante registrado |

---

## Dashboard Analitico

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD300 | O sistema deve exibir metricas de volume por periodo selecionado: total entregas, concluidas, canceladas |
| OSD301 | O sistema deve exibir performance por motoboy: entregas realizadas, tempo medio, distancia media |
| OSD302 | O sistema deve exibir volume de entregas por bairro/regiao em mapa de calor ou lista rankeada |
| OSD303 | O sistema deve exibir tempo medio de entrega (coleta a entrega) por periodo |
| OSD304 | O sistema deve exibir taxa de entregas concluidas vs canceladas como percentual |
| OSD305 | O sistema deve permitir filtro por periodo em todas as metricas (dia, semana, mes, custom) |
| OSD306 | O sistema deve exibir receita total e receita media por entrega no periodo |
| OSD307 | O sistema deve exibir grafico de tendencia (entregas por dia no periodo selecionado) |

---

## Matriz de Permissoes — Wave 2

| Funcionalidade | operator | shop | courier |
|----------------|----------|------|---------|
| Configurar tabela de precos | Sim | - | - |
| Ver fechamento de motoboys | Sim | - | - |
| Gerar fechamento | Sim | - | - |
| Marcar pagamento de motoboy | Sim | - | - |
| Ver fatura (todas) | Sim | - | - |
| Ver fatura (propria) | - | Sim | - |
| Gerar fatura | Sim | - | - |
| Exportar fatura PDF | Sim | Sim | - |
| Ver extrato (proprio) | - | - | Sim |
| Capturar POD | - | - | Sim |
| Ver POD de entrega | Sim | Sim | Sim |
| Configurar POD obrigatorio | Sim | - | - |
| Dashboard analitico | Sim | - | - |

---

## RNF - Requisitos Nao Funcionais (Wave 2)

| ID | Requisito |
|----|-----------|
| RNF020 | O sistema deve limitar foto do comprovante a 2MB por imagem |
| RNF021 | O sistema deve comprimir foto do comprovante no client antes do upload (qualidade 80%, max 1280px largura) |
| RNF022 | O sistema deve calcular distancia entre coordenadas usando formula Haversine |
| RNF023 | O sistema deve armazenar valores monetarios com precisao de 2 casas decimais (numeric(10,2)) |
| RNF024 | O sistema deve gerar PDFs de fatura com formatacao profissional (logo, dados da empresa, detalhamento) |
| RNF025 | O sistema deve processar calculos de fechamento e faturamento em menos de 5 segundos (p95) para ate 500 entregas |

---

## Rastreabilidade

| Modulo | Requisitos |
|--------|------------|
| Tabela de Precos | OSD200-OSD210 |
| Fechamento Financeiro | OSD220-OSD227 |
| Extrato do Motoboy | OSD240-OSD245 |
| Faturamento do Lojista | OSD260-OSD268 |
| Proof of Delivery | OSD280-OSD287 |
| Dashboard Analitico | OSD300-OSD307 |
| Nao Funcionais (Wave 2) | RNF020-RNF025 |

---

## Rastreabilidade — Discoveries → Requisitos

| Discovery | Score | Requisitos Wave 2 |
|-----------|-------|-------------------|
| D-004 (Fechamento caixa) | 9 | OSD220-OSD227 |
| D-014 (Transparencia pgto motoboy) | 9 | OSD240-OSD245 |
| G-003 (Fechamento financeiro auto) | 9 | OSD220-OSD227 |
| G-009 (Extrato motoboy) | 9 | OSD240-OSD245 |
| D-018 (Sem tabela precos) | 8 | OSD200-OSD210 |
| G-012 (Tabela de frete) | 8 | OSD200-OSD210 |
| D-012 (Cobranças erradas lojista) | 8 | OSD260-OSD268 |
| G-008 (Historico faturamento lojista) | 8 | OSD260-OSD268 |
| G-014 (Faturamento automatizado) | 8 | OSD260-OSD268 |
| D-017 (Sem comprovante entrega) | 8 | OSD280-OSD287 |
| D-023 (Sem comprovante motoboy) | 7 | OSD280-OSD287 |
| G-013 (POD digital) | 8 | OSD280-OSD287 |
| G-004 (Dados e metricas) | 8 | OSD300-OSD307 |
