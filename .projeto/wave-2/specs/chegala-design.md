# Chega.la - Design e Arquitetura Wave 2

Extensoes de arquitetura para a Wave 2 do Chega.la — novas rotas REST, novos eventos SSE e novos modulos no frontend para financeiro, POD, faturamento e analytics. Incremental sobre Wave 1 — stack, monorepo, convencoes e autenticacao permanecem inalterados.

---

## Novas Dependencias

| Funcao | Biblioteca | Versao | Modulo |
|--------|------------|--------|--------|
| Captura de foto | nativa (MediaDevices API) | — | motoboy |
| Canvas assinatura | react-signature-canvas | ^1 | motoboy |
| Compressao imagem | browser-image-compression | ^2 | motoboy |
| Graficos | recharts | ^2 | central |
| Geracao PDF | @react-pdf/renderer | ^4 | central, lojista |
| Calculo distancia | haversine (util proprio) | — | backbone |

---

## Estrutura do Monorepo (extensoes Wave 2)

```
apps/
  backbone/
    src/
      routes/
        pricing.ts          <- CRUD tabelas de preco e regras
        financial.ts         <- fechamentos financeiros
        invoices.ts          <- faturas de lojistas
        analytics.ts         <- metricas e dashboard
        delivery-proof.ts    <- upload e consulta de POD
      services/
        pricing.service.ts   <- calculo de preco por entrega
        financial.service.ts <- geracao de fechamento
        invoice.service.ts   <- geracao de fatura
        analytics.service.ts <- queries de metricas
        distance.service.ts  <- calculo de distancia Haversine
        pdf.service.ts       <- geracao de PDF de fatura
    db/
      schema/
        pricing.ts           <- pricing_tables, pricing_rules, shop_pricing_overrides
        financial.ts          <- financial_closings, financial_closing_items
        invoices.ts           <- invoices, invoice_items
        delivery-proof.ts     <- delivery_proofs
        delivery-price.ts     <- delivery_prices
        company-config.ts     <- company_configs

  central/
    src/
      pages/
        precos/              <- configuracao de tabelas de preco
        financeiro/          <- fechamentos de motoboys
        faturas/             <- faturas de lojistas
        analytics/           <- dashboard analitico
      components/
        pricing/             <- formularios e listas de regras
        financial/           <- lista e detalhamento de fechamentos
        invoices/            <- lista e detalhamento de faturas
        analytics/           <- graficos e metricas
        delivery-proof/      <- exibicao de comprovante

  lojista/
    src/
      pages/
        faturas/             <- historico de faturas
      components/
        invoices/            <- lista e detalhamento de faturas
        delivery-proof/      <- exibicao de comprovante

  motoboy/
    src/
      pages/
        extrato/             <- extrato de ganhos
      components/
        proof-capture/       <- captura de foto + assinatura
        earnings/            <- lista e totais do extrato

packages/
  shared/
    schemas/
      entities/
        pricing-table.ts     <- PricingTableSchema, PricingRuleSchema
        delivery-price.ts    <- DeliveryPriceSchema
        financial-closing.ts <- FinancialClosingSchema
        invoice.ts           <- InvoiceSchema
        delivery-proof.ts    <- DeliveryProofSchema
        company-config.ts    <- CompanyConfigSchema
      api/
        pricing.ts           <- request/response schemas
        financial.ts
        invoices.ts
        analytics.ts
        delivery-proof.ts
      events/
        financial.ts         <- closing_created, closing_paid
        invoice.ts           <- invoice_created, invoice_sent
```

---

## Comunicacao (extensoes Wave 2)

### REST — Novas Rotas

#### Tabela de Precos

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/pricing-tables | Listar tabelas de preco da empresa |
| POST | /api/pricing-tables | Criar tabela de preco |
| PATCH | /api/pricing-tables/:id | Atualizar tabela (nome, active) |
| DELETE | /api/pricing-tables/:id | Remover tabela (se nao usada em entregas) |
| GET | /api/pricing-tables/:id/rules | Listar regras da tabela |
| POST | /api/pricing-tables/:id/rules | Adicionar regra a tabela |
| PATCH | /api/pricing-rules/:id | Atualizar regra |
| DELETE | /api/pricing-rules/:id | Remover regra |
| POST | /api/pricing-tables/:id/simulate | Simular calculo para distancia X |
| GET | /api/shops/:id/pricing-override | Ver override do lojista |
| PUT | /api/shops/:id/pricing-override | Definir/atualizar override |
| DELETE | /api/shops/:id/pricing-override | Remover override |

#### Fechamento Financeiro

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/financial/closings | Listar fechamentos (filtro: courier_id, status, periodo) |
| POST | /api/financial/closings | Gerar fechamento (body: courier_id, period_start, period_end) |
| GET | /api/financial/closings/:id | Detalhes do fechamento com items |
| PATCH | /api/financial/closings/:id/confirm | Confirmar fechamento (draft → confirmed) |
| PATCH | /api/financial/closings/:id/pay | Marcar como pago (confirmed → paid) |

#### Extrato do Motoboy

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/couriers/me/earnings | Extrato do motoboy autenticado (filtro: periodo) |
| GET | /api/couriers/me/earnings/summary | Resumo: total dia, semana, mes |

#### Faturas

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/invoices | Listar faturas (filtro: shop_id, status, periodo) |
| POST | /api/invoices | Gerar fatura (body: shop_id, period_start, period_end) |
| GET | /api/invoices/:id | Detalhes da fatura com items |
| PATCH | /api/invoices/:id/send | Enviar fatura (draft → sent) |
| PATCH | /api/invoices/:id/pay | Marcar como paga (sent → paid) |
| GET | /api/invoices/:id/pdf | Download PDF da fatura |
| GET | /api/shops/me/invoices | Faturas do lojista autenticado |

#### Proof of Delivery

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | /api/deliveries/:id/proof | Upload de comprovante (multipart: photo, signature) |
| GET | /api/deliveries/:id/proof | Consultar comprovante da entrega |

#### Analytics

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/analytics/overview | Metricas gerais: volume, taxa conclusao, tempo medio |
| GET | /api/analytics/couriers | Performance por motoboy |
| GET | /api/analytics/neighborhoods | Volume por bairro |
| GET | /api/analytics/revenue | Receita total e media |
| GET | /api/analytics/trend | Entregas por dia no periodo |

#### Configuracoes

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/company/config | Ver configuracoes da empresa |
| PATCH | /api/company/config | Atualizar configuracoes (pod_required, periodos) |

### SSE — Novos Eventos

| Canal | Evento | Payload | Quando |
|-------|--------|---------|--------|
| /events/company/{companyId} | closing_created | closingId, courierId, courierName, totalAmount, periodStart, periodEnd | Fechamento gerado |
| /events/company/{companyId} | closing_paid | closingId, courierId, courierName, totalAmount | Fechamento pago |
| /events/company/{companyId} | invoice_created | invoiceId, shopId, shopName, totalAmount, periodStart, periodEnd | Fatura gerada |
| /events/company/{companyId} | invoice_sent | invoiceId, shopId, shopName | Fatura enviada |
| /events/company/{companyId} | delivery_priced | deliveryId, orderId, totalPrice | Entrega recebeu valor calculado |
| /events/courier/{courierId} | closing_paid | closingId, totalAmount, periodStart, periodEnd | Fechamento do motoboy foi pago |
| /events/order/{orderId} | invoice_sent | invoiceId, shopName | Fatura enviada para lojista do pedido |

### Eventos SSE Tipados (Wave 2)

```typescript
// packages/shared/schemas/events/financial.ts

ClosingCreatedEvent = { type: 'closing_created', closingId, courierId, courierName, totalAmount, periodStart, periodEnd }
ClosingPaidEvent = { type: 'closing_paid', closingId, courierId, courierName, totalAmount }
InvoiceCreatedEvent = { type: 'invoice_created', invoiceId, shopId, shopName, totalAmount, periodStart, periodEnd }
InvoiceSentEvent = { type: 'invoice_sent', invoiceId, shopId, shopName }
DeliveryPricedEvent = { type: 'delivery_priced', deliveryId, orderId, totalPrice }
```

---

## Fluxo — Calculo de Preco

```
Entrega criada (POST /orders/:id/assign)
   |
   |-- Buscar tabela de preco:
   |     1. Override do lojista? → usar override
   |     2. Senao → tabela ativa da empresa
   |
   |-- Calcular distancia estimada (Haversine: pickup → delivery coords)
   |
   |-- Avaliar regras da tabela (por priority):
   |     - per_km: base + (distancia * per_km_value)
   |     - distance_range: valor da faixa correspondente
   |     - neighborhood: valor do bairro de destino
   |     - flat_rate: valor fixo
   |
   |-- Aplicar surcharges ativos (rain, night, weekend):
   |     - percentage: preco_base * (surcharge_value / 100)
   |     - fixed: preco_base + surcharge_value
   |
   |-- Gravar delivery_prices
   |-- Emitir SSE: delivery_priced
```

---

## Fluxo — Fechamento Financeiro

```
Operador solicita fechamento (POST /financial/closings)
   |
   |-- Buscar entregas do motoboy no periodo:
   |     WHERE courier_id = X AND status = 'delivered'
   |     AND delivered_at BETWEEN period_start AND period_end
   |     AND delivery NOT IN (SELECT delivery_id FROM financial_closing_items)
   |
   |-- Calcular totais: entregas, distancia, valor
   |
   |-- Criar financial_closing (status: draft) + financial_closing_items
   |
   |-- Emitir SSE: closing_created → canal company
   |
   Operador confirma → PATCH /closings/:id/confirm → status: confirmed
   |
   Operador paga → PATCH /closings/:id/pay → status: paid
   |
   |-- Emitir SSE: closing_paid → canal company + canal courier
```

---

## Fluxo — Faturamento do Lojista

```
Operador solicita fatura (POST /invoices)
   |
   |-- Buscar entregas do lojista no periodo:
   |     WHERE shop_id = X AND status = 'delivered'
   |     AND delivered_at BETWEEN period_start AND period_end
   |     AND delivery NOT IN (SELECT delivery_id FROM invoice_items)
   |
   |-- Calcular totais: entregas, distancia, valor
   |
   |-- Criar invoice (status: draft) + invoice_items
   |
   |-- Emitir SSE: invoice_created → canal company
   |
   Operador envia → PATCH /invoices/:id/send → status: sent
   |
   |-- Emitir SSE: invoice_sent → canal company + canal order (para lojista)
   |
   Operador confirma pgto → PATCH /invoices/:id/pay → status: paid
```

---

## Fluxo — Proof of Delivery

```
Motoboy clica "Entregar" no app
   |
   |-- Verificar company_config.pod_required:
   |     - Se true: POD obrigatorio, abrir tela de captura
   |     - Se false: POD opcional, oferecer "Capturar" ou "Pular"
   |
   |-- Tela de captura:
   |     1. Foto via camera (MediaDevices API)
   |     2. Comprimir client-side (max 1280px, 80% quality)
   |     3. Assinatura digital (canvas touch)
   |     4. Capturar GPS + timestamp
   |
   |-- Upload (POST /deliveries/:id/proof):
   |     - Foto → Supabase Storage (bucket: delivery-proofs)
   |     - Assinatura → Supabase Storage
   |     - Metadata: lat, lng, captured_at
   |     - Gravar delivery_proofs
   |
   |-- Prosseguir com status "delivered"
   |-- Emitir SSE: order_status (delivered) com has_proof: true
```

---

## Navegacao (extensoes Wave 2)

### Central da Empresa

| Item | Rota | Icone |
|------|------|-------|
| Dashboard | / | LayoutDashboard |
| Pedidos | /pedidos | Package |
| Motoboys | /motoboys | Bike |
| Lojistas | /lojistas | Store |
| Mapa | /mapa | Map |
| **Precos** | **/precos** | **DollarSign** |
| **Financeiro** | **/financeiro** | **Wallet** |
| **Faturas** | **/faturas** | **FileText** |
| **Analytics** | **/analytics** | **BarChart3** |

### App do Lojista

| Item | Rota | Icone |
|------|------|-------|
| Pedidos | / | Package |
| Nova Entrega | /nova | Plus |
| Historico | /historico | Clock |
| **Faturas** | **/faturas** | **FileText** |

### App do Motoboy

| Item | Rota | Icone |
|------|------|-------|
| Entregas | / | Package |
| Historico | /historico | Clock |
| Status | /status | Circle |
| **Extrato** | **/extrato** | **Wallet** |

---

## Rastreabilidade

| Decisao | Justificativa | Vinculante |
|---------|---------------|------------|
| Haversine para distancia | Calculo rapido e preciso o suficiente para distancias urbanas (< 50km). Sem dependencia de API externa. | Sim |
| Preco calculado ao atribuir motoboy | Momento mais cedo em que temos coleta e entrega definidos. Recalculado se distancia real divergir. | Sim |
| Snapshot em closing/invoice items | Valores congelados no momento da geracao. Alteracoes futuras em tabela de preco nao afetam fechamentos/faturas ja gerados. | Sim |
| POD no Supabase Storage | Consistente com storage de fotos existente (motoboy photo). Buckets separados para organizacao. | Sim |
| react-signature-canvas para assinatura | Biblioteca leve, compativel com canvas touch mobile, amplamente usada. | Sim |
| recharts para graficos | Biblioteca React-native, composavel, integrada com dados do react-query. | Sim |
| @react-pdf/renderer para PDF | Renderizacao React-based, JSX para layout, sem dependencias server-side pesadas. | Sim |
