# Brainstorming Wave 3 — Chega.la

**Data**: 2026-03-01
**Foco**: Dispatch inteligente, ETA, rastreamento cliente final, regulatório (periculosidade 2026), IA operacional, retenção de motoboys
**Base**: Wave-2 ranking (37 discoveries, 28 implementadas, 8 não implementadas, 1 parcial)

---

## 1. Contexto — O que mudou desde a wave 2

### 1.1 Estado do produto

O Chega.la saiu da wave 2 com uma base sólida:

- **Auth + 3 apps PWA** (Central, Lojista, Motoboy) sincronizados via SSE
- **Ciclo completo de pedidos**: criação → atribuição → coleta → trânsito → entregue, com state machine e eventos
- **Pricing engine** com 5 tipos de regra (km, faixa de distância, bairro, taxa fixa, sobretaxa), dinâmico (chuva/noite/fim de semana), override por lojista, simulador
- **Módulo financeiro completo**: fechamento por motoboy (draft→confirmed→paid), faturamento para lojistas (draft→sent→paid, com PDF), extrato do motoboy
- **POD (Proof of Delivery)**: foto + assinatura digital + GPS + timestamp, captura pelo motoboy, visualização por todos
- **Analytics**: overview, performance por motoboy, volume por bairro, receita, tendências por data
- **Rastreamento em tempo real**: GPS do motoboy via SSE, mapa na Central e no App do Lojista

### 1.2 O que NÃO foi implementado (wave-2 remaining)

| ID | Score | Descrição | Tema |
|---|---|---|---|
| D-005 | 7 | Rotas mal planejadas (dispatch duplo) | Dispatch |
| D-019 | 7 | Impacto regulatório periculosidade 30% | Regulatório |
| D-020 | 7 | Alta rotatividade de motoboys | Retenção |
| D-021 | 7 | Sem ETA para lojista | ETA |
| D-022 | 6 | Sem notificação para cliente final | Rastreamento |
| G-005 | 7 | IA progressiva (diferencial futuro) | IA |
| G-015 | 7 | Dispatch inteligente (sugestão auto) | Dispatch |
| G-016 | 6 | Link de rastreamento para cliente final | Rastreamento |
| G-017 | 7 | Proteção POD perspectiva motoboy | POD/Retenção |
| D-009 | 4 | Resiliência operacional (func. sai) | Resiliência |
| D-016 | 4 | Sem roteirização (Waze complementa) | Rota |

**Observação crítica**: max score dos itens não implementados é 7. Nenhum item score 8+ ficou pendente. Os core gaps (financeiro, POD, analytics) foram TODOS resolvidos na wave 2.

### 1.3 Mercado em março 2026

**Regulatório**:
- **Portaria MTE 2.021/2025** publicada: adicional de periculosidade de 30% para motociclistas com vínculo CLT entra em vigor em **3 de abril de 2026** (próximo mês!)
- Afeta salário base, férias, 13º, FGTS, horas extras, verbas rescisórias
- Motoboys de aplicativo (PJ/MEI) NÃO são afetados diretamente, mas jurisprudência pode expandir
- Empresas de entregas com motoboys CLT precisam recalcular toda a estrutura de custos AGORA

**Concorrentes**:
- **Entregas Expressas** (Carvs Sistemas): 250+ empresas, 5M+ pedidos. Tem agrupamento de rotas, distribuição em lote, integração iFood/Zé Delivery, tarifa dinâmica, ranking de entregadores, app publicado nas lojas (white-label). Preço: R$174-2.145/mês.
- **SyLog GR EXP**: 100% online, comprovante com assinatura digital, distribuição em lote de OS, verificação de CNH automática, bloqueio por inadimplência, faturamento/NF, fluxo de caixa integrado
- **GestãoClick**: Programa para empresas de motoboy com gestão financeira integrada (contas a pagar/receber, fluxo de caixa)
- **Motoboy.App**: Localiza motoboy mais próximo automaticamente (dispatch por proximidade)
- **Loggi**: ETA em tempo real, tracking público, ML para otimização de rotas
- **Link de Rastreio (linkderastreio.com.br)**: Serviço especializado em tracking personalizado com marca da empresa, integrado a WhatsApp

**Tendências logística 2026**:
- IA assume decisões de rota, alocação de frota e abastecimento em tempo real
- Last mile concentra >50% do custo total — automação é prioridade
- Consumidor digital brasileiro espera entregas rápidas, status claro e preço competitivo
- Roteirização dinâmica, microfulfillment, lockers inteligentes como tendências
- 87% das organizações que avançaram em transformação digital ampliaram lucros (KPMG)

---

## 2. Dores identificadas (wave 3)

### 2.1 Dores dos não implementados — reavaliação

**D-019 — Periculosidade 30% (7→8)** ⬆️
Urgência mudou: de "risco futuro" para "obrigação legal em 30 dias". A Portaria MTE 2.021/2025 foi publicada e entra em vigor em 03/04/2026. Empresas com motoboys CLT que não se prepararem arriscam ações trabalhistas, multas e passivos previdenciários. O sistema financeiro do Chega.la calcula valores por entrega e fechamento, mas NÃO tem campo para adicional de periculosidade nem simulador de impacto no custo operacional. Reclassificação: 7→8.

**D-005 — Rotas mal planejadas (7→7)** →
Mantém. O desperdício existe mas Waze/Google Maps complementam. Roteirização avançada (TSP/VRP) é complexa e não agrega o suficiente para o porte dos clientes-alvo (5-30 motoboys). Sem mudança de contexto.

**D-020 — Alta rotatividade (7→7)** →
Mantém. Wave 2 implementou financeiro transparente + POD, que são os maiores fatores de retenção. A rotatividade residual é mais cultural/mercado do que solucionável por software.

**D-021 — Sem ETA (7→7)** →
Mantém. Importante mas não bloqueante. O app mostra status em tempo real e posição no mapa, o que reduz a ansiedade. ETA calculado seria bom mas não é gap crítico.

**D-022 — Sem notificação cliente final (6→6)** →
Mantém. Nice-to-have. Lojista recebe tudo pelo app e pode repassar. Link de tracking público seria melhor.

**D-009 — Resiliência operacional (4→3)** ⬇️
Desce. O sistema em si É a resiliência. Todo conhecimento operacional está no software, não na cabeça de uma pessoa. Com 2 waves implementadas, o risco reduziu ainda mais.

**D-016 — Sem roteirização (4→4)** →
Mantém. Waze continua complementando. Baixa prioridade.

### 2.2 Novas dores (wave 3)

**D-024 — Dispatch manual é gargalo em escala**
Perfil: empresário. Quando a operação cresce para 15+ motoboys simultâneos, o operador gasta tempo excessivo decidindo quem atribuir a cada pedido. Precisa verificar quem está disponível, onde está, e fazer a atribuição manual. Em horário de pico (11h-13h, 18h-21h) com 20+ pedidos/hora, vira gargalo. Concorrentes como Entregas Expressas e SyLog têm distribuição em lote e por proximidade. **Score: 7.** Não é bloqueante para operações menores (5-10 motoboys), que são maioria dos clientes iniciais.

**D-025 — Sem notificações automatizadas fora do app**
Perfil: lojista. Mudanças de status só visíveis dentro do app via SSE. Se lojista não está com o app aberto, não sabe que pedido foi coletado ou entregue. Sem webhook, email, ou WhatsApp automático. Em 2026, notificações proativas são expectativa baseline (iFood, Rappi, Loggi notificam por push e email). **Score: 6.** O SSE funciona bem enquanto app está aberto; fora do app é gap mas não é crítico para operação.

**D-026 — Sem simulador de impacto regulatório no financeiro**
Perfil: empresário. Com a periculosidade de 30% entrando em abril/2026, empresário não consegue simular como o adicional afeta seu custo por entrega e margem. Precisa recalcular tabela de preços, repasses e fechamentos. O módulo financeiro existe mas não tem essa camada de compliance. **Score: 6.** Ferramenta de planejamento, não operacional. Empresário pode fazer isso em planilha por enquanto.

### 2.3 Ganhos dos não implementados — reavaliação

**G-005 — IA progressiva (7→6)** ⬇️
Desce. A base de dados ainda é insuficiente para IA real (poucas empresas, poucos dados históricos). O diferencial de IA é futuro. Nível 1 (acompanhamento) é essencialmente o que o dashboard/analytics já faz. Nível 2 (copiloto) e Nível 3 (agente) dependem de volume de dados que não existe ainda. Reclassificação: 7→6.

**G-015 — Dispatch inteligente (7→7)** →
Mantém. Sugestão de motoboy mais próximo seria útil, mas manual funciona para maioria das operações atuais (5-15 motoboys). Concorrentes maiores têm, mas o Chega.la compete por profissionalização, não por feature parity total.

**G-016 — Link de rastreamento (6→7)** ⬆️
Sobe. Em março 2026, tracking público tornou-se expectativa padrão. Link de Rastreio (linkderastreio.com.br) é serviço dedicado a isso. iFood, Rappi, Loggi todos oferecem. Profissionaliza a empresa de entregas perante o cliente final. Reclassificação: 6→7.

**G-017 — POD proteção motoboy (7→implementado)** ✅
Reclassificado como IMPLEMENTADO. O sistema de POD da wave 2 permite que o motoboy capture foto + assinatura digital + GPS + timestamp. O POD é armazenado e visualizável no histórico. A infraestrutura de proteção existe — o motoboy tem registro permanente de cada entrega. O que G-017 descreve (proteção contra acusações falsas via comprovante) É o que o POD implementado faz.

### 2.4 Novos ganhos (wave 3)

**G-018 — ETA básico calculado automaticamente**
Perfil: lojista/empresário. Cálculo simples: distância / velocidade média histórica (dados de GPS já existem). Sem ML, apenas média ponderada com dados reais. Mostrado para lojista no acompanhamento do pedido e para operador na Central. **Score: 7.** Factível com dados existentes, agrega valor perceptível, mas não é transformacional.

**G-019 — Página pública de rastreamento**
Perfil: lojista. URL única por entrega, sem login necessário, mapa read-only com posição do motoboy + status + ETA. Lojista copia link e envia ao cliente final via WhatsApp. Profissionaliza drasticamente a operação. **Score: 7.** Complementa G-016. É uma feature que lojistas de iFood/Rappi já esperam.

**G-020 — Ranking e gamificação de entregadores**
Perfil: motoboy/empresário. Motoboys mais produtivos ganham destaque. Métricas: entregas/dia, tempo médio, taxa de conclusão. Entregas Expressas já tem "ranking de entregadores". Incentiva performance e reduz rotatividade. **Score: 5.** Nice-to-have, analytics já fornece os dados base.

**G-021 — Notificações via webhook/WhatsApp Business**
Perfil: lojista/empresário. Quando entrega muda de status, dispara notificação configurável (webhook para integração, WhatsApp Business API para lojista/cliente final). **Score: 6.** Infraestrutura de notificação, não feature de produto. Webhook é infra, WhatsApp é custo adicional.

---

## 3. Alívios e Criadores de Ganho

### 3.1 Alívios (o que removeria a dor)

| Dor | Alívio |
|---|---|
| D-019 (periculosidade) | Campo de regime trabalhista no cadastro de motoboy (CLT/PJ/MEI) + cálculo automático de adicional 30% no fechamento financeiro + flag no pricing simulation |
| D-024 (dispatch manual) | Sugestão automática do motoboy mais próximo/disponível baseada em última localização GPS conhecida. Operador aceita ou sobrescreve. |
| D-021 (sem ETA) | Cálculo distância/velocidade média com dados GPS existentes. Exibição no app do lojista e na Central. |
| D-022 + D-025 (notificações) | Página pública de tracking (resolve notificação passiva) + webhook para integrações (notificação ativa) |
| D-005 (rotas duplicadas) | Visualização de motoboys no mapa com pedidos pendentes por região. Decisão visual, sem algoritmo complexo. |

### 3.2 Criadores de Ganho (o que geraria valor novo)

| Ganho | Criador |
|---|---|
| G-016 + G-019 (tracking público) | URL pública por entrega com mapa read-only. Sem login. Lojista compartilha com cliente final. |
| G-018 (ETA) | Dado derivado dos GPS tracks existentes. Fórmula: distância restante / velocidade média dos últimos N minutos. |
| G-015 (dispatch inteligente) | Botão "sugerir motoboy" que ordena por proximidade e disponibilidade. Não automatiza, apenas sugere. |
| G-005→G-021 (IA→webhook) | Em vez de IA complexa, webhook configurável para integrações simples. Mais valor real do que IA prematura. |

---

## 4. Priorização wave 3

### 4.1 Distribuição de scores (todas as discoveries não implementadas)

| Score | Count | Items |
|---|---|---|
| 8 | 1 | D-019 |
| 7 | 7 | D-005, D-020, D-021, D-024, G-015, G-018, G-019 |
| 6 | 5 | D-022, D-025, D-026, G-005, G-021 |
| 5 | 1 | G-020 |
| 4 | 1 | D-016 |
| 3 | 1 | D-009 |

### 4.2 Análise de threshold

**Wave 1**: 27 discoveries, 15 implementadas → GO (12 com score 8+)
**Wave 2**: 37 discoveries (10 novas), 28 implementadas → GO (12 com score 8+ não implementadas)
**Wave 3**: 44 discoveries (7 novas), 29 implementadas → **?**

**Indicadores para STOP:**
- Core gaps (financeiro, POD, analytics) TODOS resolvidos
- Zero novas discoveries com score >= 8
- Único item score 8 (D-019) é compliance regulatória, implementação pequena
- Itens restantes são otimizações (dispatch, ETA) e nice-to-haves (tracking, ranking)
- Tendência clara de diminishing returns: wave-1 tinha 12 items 8+, wave-2 trouxe mais 5 items 8+ (todos implementados), wave-3 trouxe 0 items 8+

**Indicadores para GO:**
- D-019 (score 8) é urgente — periculosidade em 30 dias
- Link de tracking público (G-016/G-019) é expectativa padrão no mercado
- Dispatch inteligente (G-015) é feature de todos os concorrentes
- ETA (G-018) agrega valor percebido pelo lojista

**Recomendação preliminar**: Borderline. Se GO, wave curta e focada (3-4 features max). Se STOP, D-019 pode ser tratado como hotfix incremental sem necessidade de wave completa.

→ Decisão final no F-002.

---

## 5. Perfis cobertos

| Perfil | Dores wave-3 | Ganhos wave-3 | Cobertura |
|---|---|---|---|
| Empresário | D-019, D-024, D-026 | G-015 | Regulatório + dispatch |
| Lojista | D-021, D-022, D-025 | G-016, G-018, G-019 | ETA + tracking + notificação |
| Motoboy | D-020 | G-017 (implementado), G-020 | Retenção (parcialmente resolvida) |

---

## 6. Fontes de pesquisa

- [Portaria MTE 2.021/2025 — periculosidade motociclistas](https://www.conjur.com.br/2026-jan-05/a-portaria-mte-2-021-2025-e-a-pacificacao-do-adicional-de-periculosidade-para-motociclistas/)
- [Adicional 30% para motoboys — impacto delivery](https://atarde.com.br/economia/adicional-de-30-para-motoboys-vira-lei-preco-do-delivery-vai-subir-1381000)
- [Periculosidade motoboy — direitos e cálculo](https://www.barbieriadvogados.com/adicional-de-periculosidade-valor-calculo/)
- [SyLog GR EXP — gestão entregas rápidas](https://www.sylog.com.br/gr-exp-gestao-entregas-rapidas)
- [SyLog — app empresa motoboy](https://www.sylog.com.br/aplicativo-empresa-motoboy)
- [GestãoClick — programa empresa motoboy](https://gestaoclick.com.br/programa-para-empresa-de-moto-boy/)
- [ETA — o que é e importância](https://comprovei.com/gestao-de-entregas/o-que-e-o-eta-estimated-time-of-arrival-ou-tempo-estimado-de-chegada/)
- [Last mile delivery — tendências Brasil](https://www.ecommercebrasil.com.br/artigos/last-mile-o-quanto-isso-impacta-em-sua-operacao)
- [Link de Rastreio — tracking personalizado](https://www.linkderastreio.com.br/)
- [Tendências logística 2026 — IA e automação](https://logweb.com.br/logistica-2026-tecnologias-eficiencia-operacional/)
- [Tendências logística 2026 — estratégias](https://uselets.com/blog/adeus-ano-velho-prepare-o-seu-negocio-para-as-tendencias-de-logistica-de-2026)
- [Logística 2026 — IA e last mile](https://www.mecalux.com.br/blog/tendencias-logistica-2026)
- [iTrack — logística 2026 insights](https://itrackbrasil.com.br/o-que-esperar-da-logistica-em-2026-tendencias-e-insights-para-estar-preparado/)
- [IPVA 2026 — isenção motos até 170cc](https://www.zuldigital.com.br/blog/ipva-sp-2026-motocicletas/)
