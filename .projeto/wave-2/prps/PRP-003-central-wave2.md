---
status: current
---

# PRP-003 — Central Wave 2: Precos, Financeiro, Faturas, Analytics

Implementar as 4 novas paginas no app Central da Empresa: configuracao de tabelas de preco, gestao de fechamentos financeiros de motoboys, gestao de faturas de lojistas com exportacao PDF, e dashboard analitico com graficos.

## Objetivo

Produzir as paginas e componentes do app Central (`apps/central/`) para a Wave 2: tela de configuracao de precos com CRUD de tabelas e regras, tela de fechamentos financeiros com geracao e acompanhamento de pagamentos, tela de faturas de lojistas com exportacao PDF, dashboard analitico com graficos recharts, visualizador de comprovantes de entrega, e toggle de configuracao POD — integrados com as APIs do backend Wave 2.

## Execution Mode

`implementar`

## Contexto

- **Central existente** — app React+Vite em `apps/central/`. Paginas existentes: `DashboardPage`, `LoginPage`, `LojistasPage`, `MapaPage`, `MotoboysPage`, `PedidosPage`. Navegacao via sidebar com react-router. UI com shadcn/ui e Tailwind CSS. Dados via react-query + fetch autenticado. SSE conectado ao canal `company/{companyId}`.
- **Padrao de paginas** — cada pagina em `apps/central/src/pages/`. Componentes reutilizaveis em `apps/central/src/components/`. Hooks em `apps/central/src/hooks/`. API calls via fetch ou wrapper com JWT do contexto auth.
- **APIs Wave 2 disponiveis** — PRP-001 e PRP-002 ja executados. Todas as rotas de pricing, financial, invoices, analytics, delivery-proof e company-config funcionais no backbone.
- **Schemas Zod disponiveis** — schemas compartilhados em `packages/shared/schemas/` para tipagem de requests e responses.
- **Navegacao Wave 2** — 4 novos itens no sidebar conforme design.md secao "Navegacao": Precos (/precos, DollarSign), Financeiro (/financeiro, Wallet), Faturas (/faturas, FileText), Analytics (/analytics, BarChart3).
- **Novas dependencias** — `recharts` para graficos, `@react-pdf/renderer` para exportacao PDF client-side.

## Especificacao

### 1. Navegacao

Adicionar 4 novos itens ao sidebar conforme `.projeto/wave-2/specs/chegala-design.md` secao "Navegacao — Central da Empresa":

| Item | Rota | Icone (lucide-react) |
|------|------|----------------------|
| Precos | /precos | DollarSign |
| Financeiro | /financeiro | Wallet |
| Faturas | /faturas | FileText |
| Analytics | /analytics | BarChart3 |

Posicionar apos os itens existentes (Mapa). Registrar rotas no router.

### 2. Pagina de Precos — Configuracao de Tabelas

Criar `apps/central/src/pages/precos/` com componentes em `apps/central/src/components/pricing/`:

- Lista de tabelas de preco da empresa com indicador da tabela ativa (US060, OSD206)
- Criar nova tabela de preco com nome (OSD200)
- Editar nome e ativar/desativar tabela. Ao ativar, a anterior desativa automaticamente (OSD206)
- Remover tabela (se nao usada em entregas)
- CRUD de regras dentro de cada tabela (OSD201-OSD205):
  - Regra por km: campos valor base + valor por km adicional
  - Regra por faixa de distancia: campos distancia min, distancia max, valor
  - Regra por bairro: campos nome do bairro, valor fixo
  - Regra taxa fixa: campo valor fixo
  - Surcharge: tipo (chuva, noturno, fim de semana), modo (percentual ou fixo), valor (OSD205)
  - Prioridade editavel (ordem de avaliacao)
- Simulacao de calculo: informar distancia, ver valor calculado antes de ativar (US060 criterio "preview")
- Secao de overrides por lojista: associar tabela especifica a um lojista (OSD208)

### 3. Pagina Financeiro — Fechamentos de Motoboys

Criar `apps/central/src/pages/financeiro/` com componentes em `apps/central/src/components/financial/`:

- Lista de fechamentos com filtros por motoboy, status (draft, confirmed, paid) e periodo (US062, OSD223)
- Resumo no topo: total pendente, total pago no periodo (US062)
- Indicadores visuais de status com cores diferenciadas (US062)
- Botao "Gerar Fechamento": formulario com selecao de motoboy e periodo (dia, semana, mes, custom) (US061, OSD220)
- Detalhamento do fechamento: lista de entregas incluidas com data, pedido, lojista, distancia, valor. Totais: entregas, distancia total, valor total (US061, OSD224)
- Acoes: confirmar (draft → confirmed), marcar pago (confirmed → paid) (US061, OSD225)
- Fechamento pago e imutavel — desabilitar acoes (OSD226)
- Atualizar lista via SSE ao receber `closing_created` ou `closing_paid` (OSD227)

### 4. Pagina Faturas — Faturamento de Lojistas

Criar `apps/central/src/pages/faturas/` com componentes em `apps/central/src/components/invoices/`:

- Lista de faturas com filtros por lojista, status (draft, sent, paid) e periodo (US065, OSD267)
- Botao "Gerar Fatura": formulario com selecao de lojista e periodo (US065, OSD260)
- Detalhamento da fatura: lista de entregas com data, numero do pedido, endereco coleta, endereco entrega, distancia, valor unitario. Totais (US065, OSD261)
- Acoes: enviar (draft → sent), marcar paga (sent → paid) (US065, OSD265)
- Fatura paga e imutavel (OSD268)
- Botao "Exportar PDF": download imediato via GET `/api/invoices/:id/pdf` (US065, OSD264)
- Atualizar lista via SSE ao receber `invoice_created` ou `invoice_sent` (OSD266)

### 5. Pagina Analytics — Dashboard Analitico

Criar `apps/central/src/pages/analytics/` com componentes em `apps/central/src/components/analytics/`:

- Filtro de periodo no topo: dia, semana, mes, custom (OSD305)
- Cards de metricas: total entregas, concluidas, canceladas, taxa conclusao (%) (US063, OSD300, OSD304)
- Tempo medio de entrega (coleta → entrega) (OSD303)
- Receita total e receita media por entrega (OSD306)
- Tabela de performance por motoboy: entregas, tempo medio, distancia media — rankeada (OSD301)
- Lista rankeada de volume por bairro (OSD302)
- Grafico de tendencia: entregas por dia no periodo (recharts BarChart ou LineChart) (OSD307)
- Dashboard separado dos contadores basicos do Wave 1 — acesso exclusivo via menu lateral (US063 criterio "separado")

Instalar `recharts` como dependencia do app central.

### 6. Componente POD Viewer

Criar componente reutilizavel em `apps/central/src/components/delivery-proof/`:

- Exibir foto do comprovante (ampliavel ao clicar) (US064, OSD284)
- Exibir assinatura digital (OSD284)
- Exibir coordenadas GPS e horario da captura (OSD284)
- Indicador visual (badge/icone) no pedido quando houver comprovante (OSD287, US064)

Integrar no detalhamento de entrega existente (tela de pedidos): secao "Comprovante" visivel quando `delivery_proof` existir (US064, OSD286).

### 7. Configuracao POD Obrigatorio

Adicionar na area de configuracoes da empresa (pode ser uma secao na pagina existente ou nova pagina minima):

- Toggle "POD obrigatorio" (US066, OSD285)
- Usar PATCH `/api/company/config` para salvar

## Limites

- **Nao modificar paginas existentes da Wave 1** — exceto adicionar itens ao sidebar/router e integrar POD viewer no detalhamento de pedidos.
- **Nao implementar backend** — apenas frontend. Consumir APIs existentes.
- **Nao implementar funcionalidades de lojista ou motoboy** — escopo dos PRPs 004 e 005.
- **Nao usar biblioteca de mapa para analytics** — usar lista rankeada para volume por bairro, nao mapa de calor (simplificacao adequada ao escopo).
- **Nao criar testes** — testes serao adicionados em waves futuras.
