---
status: current
---

# PRP-004 — App Lojista Wave 2: Faturas e Comprovantes

Implementar pagina de faturas e visualizador de comprovantes de entrega no app do Lojista.

## Objetivo

Produzir as novas funcionalidades do app Lojista (`apps/lojista/`) para a Wave 2: pagina de historico de faturas com detalhamento e exportacao PDF, e componente de visualizacao de comprovante de entrega integrado ao historico de pedidos.

## Execution Mode

`implementar`

## Contexto

- **Lojista existente** — app React+Vite em `apps/lojista/`. Paginas existentes: `HistoricoPage`, `LoginPage`, `NovaEntregaPage`, `PedidosPage`. Navegacao via sidebar/bottom-bar com react-router. UI com shadcn/ui e Tailwind CSS. Dados via react-query. SSE conectado ao canal `order/{orderId}`.
- **APIs Wave 2 disponiveis** — rota `GET /api/shops/me/invoices` retorna faturas do lojista autenticado. `GET /api/invoices/:id` retorna detalhes. `GET /api/invoices/:id/pdf` retorna PDF. `GET /api/deliveries/:id/proof` retorna comprovante.
- **Navegacao Wave 2** — 1 novo item conforme design.md: Faturas (/faturas, FileText).

## Especificacao

### 1. Navegacao

Adicionar item ao sidebar/bottom-bar conforme `.projeto/wave-2/specs/chegala-design.md` secao "Navegacao — App do Lojista":

| Item | Rota | Icone |
|------|------|-------|
| Faturas | /faturas | FileText |

### 2. Pagina de Faturas

Criar `apps/lojista/src/pages/faturas/` com componentes em `apps/lojista/src/components/invoices/`:

- Lista de faturas com periodo, quantidade de entregas, valor total, status (US080, OSD263, OSD267)
- Filtro por periodo e status (US080)
- Indicadores visuais de status: pendente, paga (US080)
- Detalhamento da fatura: lista de entregas com data, pedido, destino, distancia, valor (US080, OSD261)
- Botao "Exportar PDF": download imediato (US081, OSD264, RNF024)
- Notificacao visual quando nova fatura for gerada (via SSE `invoice_sent`) (US080, OSD266)

### 3. Componente POD Viewer

Criar componente reutilizavel em `apps/lojista/src/components/delivery-proof/`:

- Exibir foto do comprovante (ampliavel) (US082, OSD284)
- Exibir assinatura digital e horario (US082, OSD284)
- Indicador visual no pedido quando houver comprovante (US082, OSD287)

Integrar no detalhamento de pedido existente (historico): secao "Comprovante" visivel quando comprovante existir (US082, OSD286).

### 4. SSE — Novos Eventos

Escutar evento `invoice_sent` no canal SSE existente para atualizar lista de faturas em tempo real (OSD266).

## Limites

- **Nao modificar paginas existentes** — exceto integrar POD viewer no detalhamento de pedidos e adicionar item ao menu.
- **Nao implementar backend** — apenas frontend.
- **Nao implementar geracao de fatura** — lojista apenas visualiza e exporta. Geracao e responsabilidade do operador (Central).
- **Nao criar testes** — testes serao adicionados em waves futuras.
