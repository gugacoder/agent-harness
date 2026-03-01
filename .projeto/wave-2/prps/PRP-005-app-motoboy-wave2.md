---
status: current
---

# PRP-005 — App Motoboy Wave 2: POD Capture e Extrato

Implementar captura de comprovante de entrega (foto + assinatura digital) e pagina de extrato de ganhos no app do Motoboy.

## Objetivo

Produzir as novas funcionalidades do app Motoboy (`apps/motoboy/`) para a Wave 2: fluxo de captura de Proof of Delivery (foto via camera + assinatura digital via canvas touch + GPS + compressao client-side) integrado ao botao "Entregar", pagina de extrato com detalhamento de ganhos por entrega e totais acumulados, e visualizacao de comprovantes registrados no historico.

## Execution Mode

`implementar`

## Contexto

- **Motoboy existente** — app React+Vite em `apps/motoboy/`. Paginas existentes: `EntregasPage`, `HistoricoPage`, `LoginPage`, `StatusPage`. Navegacao via bottom-bar com react-router. UI com shadcn/ui e Tailwind CSS. Dados via react-query. SSE conectado ao canal `courier/{courierId}`. Fluxo de entrega existente: motoboy aceita entrega → atualiza status (coletou, a caminho, entregou). Design mobile-first (PWA instalavel).
- **APIs Wave 2 disponiveis** — `POST /api/deliveries/:id/proof` para upload de comprovante (multipart: photo, signature, lat, lng, captured_at). `GET /api/deliveries/:id/proof` para consulta. `GET /api/couriers/me/earnings` para extrato. `GET /api/couriers/me/earnings/summary` para resumo. `GET /api/company/config` para verificar se POD e obrigatorio.
- **Navegacao Wave 2** — 1 novo item conforme design.md: Extrato (/extrato, Wallet).
- **Novas dependencias** — `react-signature-canvas` para canvas de assinatura, `browser-image-compression` para compressao de foto no client.

## Especificacao

### 1. Navegacao

Adicionar item ao bottom-bar conforme `.projeto/wave-2/specs/chegala-design.md` secao "Navegacao — App do Motoboy":

| Item | Rota | Icone |
|------|------|-------|
| Extrato | /extrato | Wallet |

### 2. Fluxo de Captura de POD

Modificar o fluxo de "Entregar" existente no app motoboy para incluir captura de comprovante (US100):

1. Ao clicar "Entregar", verificar `company_config.pod_required` (OSD285):
   - Se `true`: abrir tela de captura obrigatoriamente (nao permite pular)
   - Se `false`: oferecer opcoes "Capturar comprovante" ou "Pular" (US100)

2. Tela de captura — 3 etapas sequenciais:
   - **Passo 1 — Foto**: capturar foto via camera do celular usando MediaDevices API (`getUserMedia` com `facingMode: environment`). Nao permitir selecao da galeria — apenas camera (US100, OSD280). Comprimir client-side: max 1280px largura, qualidade 80%, resultado max 2MB (RNF020, RNF021). Usar `browser-image-compression`.
   - **Passo 2 — Assinatura**: coletar assinatura digital em canvas touch usando `react-signature-canvas` (US100, OSD281). Botao "Limpar" para refazer. Canvas deve ocupar largura total da tela mobile.
   - **Passo 3 — Confirmar e enviar**: preview da foto e assinatura. Botao "Confirmar e Enviar". Capturar coordenadas GPS e timestamp automaticamente neste momento (OSD282).

3. Upload via `POST /api/deliveries/:id/proof` — multipart com photo (blob), signature (blob exportado do canvas como PNG), lat, lng, captured_at (OSD283).

4. Feedback visual durante upload: indicador de progresso. Ao concluir, mostrar confirmacao de sucesso e prosseguir com status "delivered" (US100).

5. Se upload falhar, permitir retry sem perder os dados capturados.

Instalar `react-signature-canvas` e `browser-image-compression` como dependencias do app motoboy.

### 3. Pagina de Extrato

Criar `apps/motoboy/src/pages/extrato/` com componentes em `apps/motoboy/src/components/earnings/`:

- Lista de entregas realizadas com: data, lojista, distancia, valor ganho por entrega (US101, OSD240, OSD245)
- Total acumulado por dia visivel (agrupamento por data) (US101, OSD241)
- Seletor de periodo: semana, mes (US101, OSD243)
- Total do periodo selecionado em destaque no topo (US101, OSD242)
- Indicador de status de pagamento por fechamento: pendente ou pago, com cores diferenciadas (US101, OSD244)
- Notificacao visual quando fechamento for pago (via SSE `closing_paid` no canal courier) (US101)

### 4. Visualizacao de Comprovantes no Historico

Integrar no historico de entregas existente (`HistoricoPage`):

- Indicador visual (badge/icone) quando a entrega possui comprovante registrado (US102, OSD287)
- Ao clicar, exibir foto (ampliavel), assinatura e horario do registro (US102, OSD284)

### 5. SSE — Novos Eventos

Escutar evento `closing_paid` no canal `courier/{courierId}` para:
- Atualizar pagina de extrato em tempo real
- Exibir notificacao de pagamento recebido (OSD227)

## Limites

- **Nao modificar fluxo de entrega existente** — apenas adicionar a etapa de POD antes de marcar como "delivered". O fluxo de status (coletou, a caminho) permanece inalterado.
- **Nao implementar backend** — apenas frontend.
- **Nao implementar compressao no servidor** — compressao e exclusivamente client-side (RNF021).
- **Nao acessar galeria de fotos** — camera apenas, para garantir foto tirada no momento (US100 criterio "nao galeria").
- **Nao criar testes** — testes serao adicionados em waves futuras.
