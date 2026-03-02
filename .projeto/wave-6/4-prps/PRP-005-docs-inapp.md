---
status: finished
finished_at: 2026-03-02T23:55:00Z
wave: 6
depends_on: []
---

# PRP-005 — Documentacao In-App: Guias de Uso

## Objetivo

Criar paginas de documentacao interna (guias de uso) nos 3 apps: Central (/docs/central), Motoboy (/docs/motoboy) e Lojista (/docs/lojista). Conteudo hardcoded em componentes React com FAQ por papel.

## Execution Mode

`implementar`

## Contexto

### Routing existente

- Central: React Router v7 em `App.tsx`. Rotas protegidas dentro de `RequireAuth` → `AppShell`.
- Motoboy: React Router v7 em `App.tsx`. Rotas protegidas dentro de `RequireAuth` → `ActiveDeliveryProvider` → `AppShell`.
- Lojista: React Router v7 em `App.tsx`. Rotas protegidas dentro de `RequireAuth` → `AppShell`.

### Layout existente

- Central: sidebar com 10 itens de navegacao (Sidebar.tsx). Bottom nav mobile (BottomNav.tsx). Icones Lucide.
- Motoboy: bottom nav com 4 tabs (BottomNav.tsx). Max-width 480px.
- Lojista: sidebar + bottom nav, mesmo padrao da Central.

### Navegacao

Cada app tem icones Lucide nos itens de navegacao. Os itens estao definidos como arrays inline nos componentes Sidebar e BottomNav de cada app.

### Decisoes tecnicas (chegala-design.md)

- Guias como paginas React internas, nao documentacao externa.
- Conteudo hardcoded em componentes (sem CMS, sem Markdown runtime).
- Cada secao com ID para deep link.
- Linguagem simples (nivel 8o ano), sem jargao tecnico.

## Especificacao

### 1. Central — Guia do Operador

Criar `apps/central/src/pages/DocsPage.tsx`.

Adicionar rota `/docs` em `App.tsx` (dentro das rotas protegidas).

Adicionar item "Ajuda" no Sidebar e BottomNav com icone `HelpCircle`.

**Estrutura do conteudo** (cada secao com `id` para deep link):

| Secao | ID | Conteudo |
|-------|----|----------|
| Visao geral | #visao-geral | O que e a Central, para que serve, como se encaixa no fluxo |
| Primeiro acesso | #primeiro-acesso | Wizard de configuracao (referencia ao onboarding) |
| Dashboard | #dashboard | O que cada metrica significa, como interpretar |
| Gestao de pedidos | #pedidos | Como criar pedido, atribuir motoboy, acompanhar status |
| Gestao de motoboys | #motoboys | Como cadastrar, monitorar status, ver historico |
| Gestao de lojas | #lojas | Como cadastrar loja, editar, ver pedidos da loja |
| Mapa | #mapa | Como funciona o rastreamento, por que motoboy pode nao aparecer |
| Precos | #precos | Como configurar tabela de precos, simulador, sobretaxas |
| Financeiro | #financeiro | Fechamento de periodo, confirmar, marcar como pago |
| Faturas | #faturas | Gerar fatura, enviar, exportar PDF |
| Analytics | #analytics | Como interpretar graficos e metricas |
| Configuracao | #configuracao | POD obrigatorio, periodo de fechamento, reexecutar wizard |
| FAQ | #faq | 8-10 perguntas reais (ver lista abaixo) |

**FAQ do operador** (minimo):
1. "Motoboy nao aparece no mapa?" → Verificar se esta online e com GPS ativo.
2. "Como exportar faturas?" → Menu Faturas > selecionar fatura > botao Exportar PDF.
3. "Como mudar o preco das entregas?" → Menu Precos > editar regras da tabela ativa.
4. "Como cadastrar um novo motoboy?" → Menu Motoboys > botao Novo Motoboy.
5. "O que e POD?" → Prova de entrega: foto + assinatura coletados pelo motoboy.
6. "Como funciona o fechamento?" → Financeiro > periodo selecionado > confirmar.
7. "Posso ter mais de uma tabela de precos?" → Sim, mas so uma fica ativa por vez.
8. "Como reexecutar o wizard?" → Configuracao > Reexecutar configuracao inicial.

### 2. Motoboy — Guia do Motoboy

Criar `apps/motoboy/src/pages/DocsPage.tsx`.

Adicionar rota `/docs` em `App.tsx`.

Adicionar item "Ajuda" no BottomNav. Como o bottom nav ja tem 4 tabs, adicionar como 5o item com icone `HelpCircle`, ou alternativamente adicionar no header como icone de ajuda. Decisao: adicionar no header (ao lado do nome do usuario) como icone `HelpCircle` clicavel que navega para `/docs`. NAO alterar o bottom nav de 4 tabs.

**Estrutura do conteudo**:

| Secao | ID | Conteudo |
|-------|----|----------|
| Como fazer login | #login | OTP WhatsApp (referencia wave-4) |
| Status online/offline | #status | O que significa, como mudar, quando ficar online |
| Como receber entregas | #entregas | Notificacao, aceitar/recusar, prazos |
| Como navegar | #navegacao | Integracao com Maps/Waze para ir ao local |
| Prova de entrega (POD) | #pod | Como tirar foto, coletar assinatura |
| Seus ganhos | #ganhos | Extrato, periodos, como e calculado |
| Perfil | #perfil | Como editar nome, telefone, foto |
| Problemas comuns | #problemas | Troubleshooting (ver tabela abaixo) |
| FAQ | #faq | 6-8 perguntas reais |

**Troubleshooting do motoboy**:

| Problema | Causa provavel | Solucao |
|----------|---------------|---------|
| Nao recebo entregas | Status offline ou GPS desativado | Verificar toggle de status e permissao de localizacao |
| App nao carrega | Sem conexao com internet | Verificar WiFi/dados moveis |
| Localizacao imprecisa | GPS com baixa precisao | Sair de ambiente fechado, aguardar calibracao |
| Nao consigo tirar foto | Permissao de camera negada | Configuracoes > Permissoes > Camera |

**FAQ do motoboy**:
1. "Quanto ganho por entrega?" → Depende da distancia. Veja Extrato para historico.
2. "Posso recusar uma entrega?" → Sim, ao receber notificacao clique em Recusar.
3. "E se o cliente nao estiver?" → Entre em contato pelo telefone informado no pedido.
4. "Como ativo minha localizacao?" → Configuracoes do celular > Localizacao > Ativar.
5. "O que acontece se eu ficar offline?" → Voce para de receber novas entregas.
6. "Como vejo meu historico?" → Tab Historico na barra inferior.

### 3. Lojista — Guia do Lojista

Criar `apps/lojista/src/pages/DocsPage.tsx`.

Adicionar rota `/docs` em `App.tsx`.

Adicionar item "Ajuda" no Sidebar e BottomNav com icone `HelpCircle`.

**Estrutura do conteudo**:

| Secao | ID | Conteudo |
|-------|----|----------|
| Como fazer login | #login | Email + senha ou OTP |
| Criar pedido | #criar-pedido | Passo a passo do formulario, campos obrigatorios |
| Enderecos salvos | #enderecos | Como usar favoritos e enderecos recentes |
| Acompanhar pedido | #acompanhar | Mapa em tempo real, status do pedido |
| Historico | #historico | Como ver entregas passadas, filtros |
| Faturas | #faturas | Como conferir faturas, periodos, valores |
| Prova de entrega | #pod | Como ver foto e assinatura da entrega |
| FAQ | #faq | 6-8 perguntas reais |

**FAQ do lojista**:
1. "Quanto custa uma entrega?" → Depende da distancia e tabela de precos do operador.
2. "Quanto tempo demora?" → Depende da disponibilidade de motoboys e distancia.
3. "Como cancelo um pedido?" → Pedidos pendentes podem ser cancelados. Em andamento, contate o operador.
4. "Posso agendar uma entrega?" → No momento, entregas sao imediatas.
5. "Como vejo a prova de entrega?" → No historico, clique na entrega > Prova de entrega.
6. "O endereco de coleta e sempre o da minha loja?" → Sim, e preenchido automaticamente.

### 4. Padrao de implementacao

Cada DocsPage deve seguir o mesmo padrao:

- Titulo da pagina no topo: "Guia de Uso" ou "Ajuda".
- Indice (table of contents) no topo com links ancora para cada secao.
- Cada secao: `<section id="secao">` com `<h2>` titulo e conteudo em `<p>`, `<ul>`, tabelas HTML.
- FAQ: lista de `<details>` + `<summary>` (acordeao nativo HTML) ou lista simples com pergunta em bold e resposta abaixo.
- Scroll suave para ancoras: `scroll-behavior: smooth` no container ou via `scrollIntoView({ behavior: "smooth" })`.
- Deep link: hash na URL funciona automaticamente com IDs nas secoes.

Estilizacao:
- Usar classes Tailwind consistentes com o app.
- Titulos: `text-lg font-semibold`.
- Texto: `text-sm text-muted-foreground`.
- Listas: `list-disc pl-6`.
- Tabelas: `border border-border` com `th` em `bg-muted`.

## Limites

- NAO usar bibliotecas de Markdown rendering (remark, rehype, etc.). Conteudo e HTML/JSX direto.
- NAO criar CMS ou sistema de edicao de conteudo. Guias sao estaticos, editados no codigo.
- NAO incluir screenshots reais. Usar descricoes textuais. Screenshots podem ser adicionados depois.
- NAO criar componente de documentacao compartilhado entre apps. Cada app tem seu DocsPage independente — conteudo e diferente e os apps sao builds separados.
- NAO adicionar dependencias npm.
- NAO remover items existentes do sidebar/bottom nav para encaixar "Ajuda". Adicionar como item extra.
- O conteudo dos guias deve refletir o estado ATUAL do produto (funcionalidades ja implementadas). Nao documentar features futuras como se existissem.
