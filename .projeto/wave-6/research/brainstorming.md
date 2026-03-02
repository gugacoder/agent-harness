# Brainstorming Wave 6 — Chega.la

**Data**: 2026-03-02
**Foco**: Onboarding de qualidade (3 apps), Documentacao/Guias de uso, Help contextual
**Base**: Wave-5 (enderecos, completude, usabilidade resolvidos) → agora foco na experiencia do primeiro uso
**Tema**: Primeira Impressao — o usuario entende o app sem ajuda?

---

## 1. Contexto — O que mudou desde a wave 5

### 1.1 Estado do produto (pos wave-5)

Assumindo waves 4-5 implementadas, o Chega.la tera:
- Seguranca solida (RBAC, super admin)
- Login moderno (OTP WhatsApp/Email)
- Perfil editavel com avatar rico
- Enderecos inteligentes (autocomplete, favoritos, pin drop, geocoding)
- CRUDs completos (lojas, motoboys, usuarios)
- Mapa confiavel com tracking real
- Interfaces completas e polidas

**O produto esta Ready-to-Market em funcionalidade.** Mas um produto funcional nao e um produto usavel se o usuario nao sabe POR ONDE COMECAR.

Problema atual: o usuario faz login e cai direto na tela principal. Sem tour, sem wizard, sem guia. Tres perguntas imediatas:
1. "O que eu faco agora?" (Central — primeiro acesso do operador)
2. "Como crio minha primeira entrega?" (Lojista — primeiro pedido)
3. "Como comeco a receber entregas?" (Motoboy — primeiro dia)

### 1.2 Mercado em 2026 — Onboarding e Documentacao

**Tendencias de onboarding em SaaS/apps 2026:**

- **Onboarding guiado e padrao**: 86% dos usuarios dizem que sao mais propensos a continuar usando um app que oferece onboarding (Wyzowl 2024)
- **Time-to-value**: o tempo entre primeiro login e primeira acao util deve ser < 5 minutos
- **Progressive disclosure**: nao mostrar tudo de uma vez; revelar funcionalidades conforme o usuario avanca
- **Contextual help**: tooltips e hints no momento certo, nao manual de 50 paginas
- **Empty states educativos**: quando uma lista esta vazia, a mensagem deve ensinar o proximo passo

**Referencia competitiva — Onboarding:**

| App | Onboarding operador | Onboarding lojista | Onboarding motoboy |
|---|---|---|---|
| **iFood** | Portal com setup wizard (dados, cardapio, horarios, pagamento) | Tutorial animado no primeiro pedido | Video explicativo + checklist (documentos, foto, veiculo) |
| **Entregas Expressas** | Wizard de configuracao (empresa, tabela precos, usuarios) | Tour guiado "Criar primeiro pedido" | Tour guiado "Sua primeira entrega" |
| **Loggi** | Dashboard com checklist de setup | — (lojista via portal web) | Onboarding em etapas: docs → aprovacao → primeiro pedido |
| **Lalamove** | — (Lalamove opera a plataforma) | Tutorial de 3 passos no primeiro uso | Checklist de documentos + tutorial |
| **Rappi** | — | — | Video + quiz de seguranca obrigatorio |
| **Chega.la (atual)** | Nenhum | Nenhum | Nenhum |

**Referencia competitiva — Documentacao:**

| App | Central de ajuda | FAQ por papel | Guia de uso | In-app help |
|---|---|---|---|---|
| **iFood** | Completa (ajuda.ifood.com.br) | Sim (restaurante, entregador, consumidor) | Videos + artigos | Tooltips + chat |
| **Entregas Expressas** | Blog + suporte | Sim | Manual PDF | Chat |
| **Loggi** | Central de ajuda | Sim | Tutorial interativo | Chat + email |
| **Chega.la (atual)** | Nenhuma | Nenhuma | Nenhum | Nenhum |

---

## 2. Novas dores identificadas (Wave 6)

### 2.1 Onboarding

**D-044 | Central: zero onboarding — operador perdido no primeiro acesso** (Score: 8)
O operador faz login na Central pela primeira vez e ve: dashboard vazio (0 entregas, 0 motoboys, 0 lojas). Nenhuma indicacao do que fazer. Perguntas imediatas sem resposta:
- Como cadastro minha empresa? (config)
- Como convido motoboys? (invite)
- Como cadastro lojas? (shops)
- Como configuro precos? (pricing)
- Como funciona o mapa? (tracking)

Sem wizard, o operador clica em telas aleatorias tentando entender. Alta chance de abandono no primeiro dia.
- **Impacto**: Critico. Primeira impressao define retencao. Operador que nao entende = empresa que nao adota.

**D-045 | Motoboy: zero onboarding — nao sabe como comecar** (Score: 8)
Motoboy faz login (pos wave-4, via OTP WhatsApp) e ve a StatusPage. Nao sabe:
- O que significa "online"? Preciso ficar online pra receber entregas?
- Como ativo minha localizacao? (GPS)
- O que acontece quando recebo uma entrega?
- Como funciona o POD (foto + assinatura)?
- Onde vejo quanto ganhei?

Motoboys sao publico de baixa paciencia para aprendizado. Se nao entender em 2 minutos, desinstala.
- **Impacto**: Critico. Motoboy = forca de trabalho. Perder motoboy no onboarding e perder capacidade operacional.

**D-046 | Lojista: zero onboarding — primeiro pedido e confuso** (Score: 7)
Lojista faz login e ve a NovaEntregaPage. Formulario com campos sem contexto:
- "Endereco de coleta" — ja esta preenchido (da loja), mas nao explica isso
- "Endereco de entrega" — campo vazio sem instrucao
- Sem indicacao de custo estimado
- Sem explicacao do fluxo (criar → operador atribui → motoboy coleta → entrega)

O lojista nao sabe o que esperar apos criar o pedido. "E agora? Alguem vai vir buscar? Quando?"
- **Impacto**: Alto. Lojista confuso cria pedidos errados ou desiste.

### 2.2 Documentacao

**D-047 | Sem documentacao de uso — nenhum guia para nenhum papel** (Score: 8)
Zero documentacao para usuario final. Nao existe:
- `docs/guides/central.md` — como operar a Central
- `docs/guides/motoboy.md` — como usar o app motoboy
- `docs/guides/lojista.md` — como usar o app lojista
- FAQ por papel
- Troubleshooting ("motoboy nao aparece no mapa", "pedido nao foi atribuido", etc.)

Quando o usuario tem duvida, nao tem onde buscar resposta. Em 2026, documentacao self-service e expectativa minima.
- **Impacto**: Alto. Usuarios recorrem ao suporte humano para duvidas basicas = custo operacional alto.

**D-048 | Sem help contextual — interface muda** (Score: 6)
Nenhuma tela tem tooltips, hints, ou links de ajuda. Campos de formulario nao tem descricoes. Botoes nao tem explicacao do que fazem. Configuracoes avancadas (pricing, closing period) nao explicam o impacto. O usuario precisa adivinhar.
- **Impacto**: Medio. Aumenta curva de aprendizado. Usuarios avancados nao precisam, mas novos sim.

---

## 3. Novos ganhos identificados (Wave 6)

### 3.1 Onboarding

**G-037 | Onboarding Central: Wizard de configuracao inicial** (Score: 8)
Wizard em etapas no primeiro acesso do operador:

**Etapa 1 — Boas-vindas** (5 segundos)
- "Bem-vindo ao Chega.la! Vamos configurar sua operacao em 5 minutos."
- Animacao breve mostrando o fluxo: pedido → motoboy → entrega

**Etapa 2 — Dados da empresa** (1 minuto)
- Nome da empresa, telefone, endereco (com autocomplete wave-5)
- Logo/avatar (com crop wave-4)
- Pular se ja configurado

**Etapa 3 — Tabela de precos** (2 minutos)
- Template pre-configurado: "Preco por km (padrao)" com valores sugeridos
- Operador ajusta ou aceita default
- Simulador rapido: "Entrega de 5km = R$ X"

**Etapa 4 — Convide sua equipe** (1 minuto)
- Convidar primeiro motoboy (telefone ou email)
- Convidar primeiro lojista (telefone ou email)
- "Pular — farei isso depois"

**Etapa 5 — Pronto!** (5 segundos)
- "Sua operacao esta configurada! Veja seu dashboard."
- Checklist visual do que foi feito + o que falta
- Link para guia completo

**Persistencia**: progresso salvo. Se operador sair no meio, retoma de onde parou. Wizard pode ser reacessado em Config > "Reexecutar configuracao inicial".

**G-038 | Onboarding Motoboy: Tutorial de primeiro uso** (Score: 8)
Sequencia de telas guiadas no primeiro login:

**Tela 1 — "Voce e um entregador Chega.la!"** (3 segundos)
- Animacao simples de motoboy no mapa
- "Vamos te preparar em 1 minuto"

**Tela 2 — Ativar localizacao** (10 segundos)
- Icone de GPS grande
- "Para receber entregas, precisamos saber onde voce esta"
- Botao "Ativar localizacao" → trigger browser permission
- Se negado: explicacao empática + instrucao de como ativar nas config do celular

**Tela 3 — Como funciona** (15 segundos)
- 3 passos visuais:
  1. 📱 "Fique online para receber entregas"
  2. 📦 "Aceite a entrega e va ate o local de coleta"
  3. ✅ "Entregue e confirme com foto + assinatura"
- Cada passo com icone + frase curta

**Tela 4 — Seu status** (5 segundos)
- Explicacao visual do toggle:
  - 🟢 Online = "Voce pode receber entregas"
  - 🔴 Offline = "Voce nao recebera entregas"
- "Mude seu status a qualquer momento"

**Tela 5 — Pronto!** (2 segundos)
- "Tudo certo! Fique online para receber sua primeira entrega."
- Botao "Ficar online agora" → ativa status + vai para StatusPage

**Persistencia**: mostrar apenas no primeiro login. Botao "Rever tutorial" no menu de perfil.

**G-039 | Onboarding Lojista: Guia de primeira entrega** (Score: 7)
Overlay guiado no primeiro acesso:

**Step 1 — Highlight do formulario**
- Seta apontando para "Endereco de entrega"
- Tooltip: "Digite o endereco de entrega ou selecione um favorito"

**Step 2 — Highlight dos campos de destinatario**
- "Informe o nome e telefone de quem vai receber"

**Step 3 — Highlight do botao confirmar**
- "Confirme e pronto! Um motoboy sera atribuido em instantes."

**Step 4 — O que esperar**
- Modal explicativo: "Apos criar o pedido, o operador atribui um motoboy. Voce acompanha tudo em tempo real no mapa."
- Linha do tempo visual: Pedido criado → Motoboy atribuido → Coletando → A caminho → Entregue

**Persistencia**: mostrar apenas no primeiro login. Link "Como funciona" no menu.

### 3.2 Documentacao

**G-040 | Guias de uso completos por papel** (Score: 8)
Criar documentacao em `docs/guides/`:

**docs/guides/central.md — Guia do Operador**
1. Visao geral: o que e a Central e para que serve
2. Primeiro acesso: wizard de configuracao
3. Dashboard: o que cada metrica significa
4. Gestao de pedidos: como criar, atribuir, acompanhar
5. Gestao de motoboys: cadastrar, monitorar, avaliar
6. Gestao de lojas: cadastrar, editar, ver historico
7. Mapa: como funciona o rastreamento, por que motoboy pode nao aparecer
8. Pricing: como configurar tabela de precos, simulador
9. Financeiro: fechamento, faturas, exportar
10. Analytics: como interpretar metricas
11. Configuracao: POD, periodos, canais OTP
12. FAQ: "Motoboy nao aparece no mapa?", "Como exportar faturas?", "Como mudar o preco?"

**docs/guides/motoboy.md — Guia do Motoboy**
1. Como fazer login (OTP WhatsApp)
2. O que e o status online/offline
3. Como receber entregas
4. Como aceitar/recusar uma entrega
5. Como navegar ate o local (integracao com Maps/Waze)
6. Como fazer a prova de entrega (foto + assinatura)
7. Onde ver meus ganhos
8. Como editar meu perfil e foto
9. Problemas comuns: "Nao recebo entregas" → verificar status + GPS + conexao
10. FAQ: "Quanto ganho por entrega?", "Posso recusar?", "E se o cliente nao estiver?"

**docs/guides/lojista.md — Guia do Lojista**
1. Como fazer login
2. Como criar um pedido de entrega
3. Como usar enderecos salvos e favoritos
4. Como acompanhar o pedido no mapa
5. Como ver o historico de entregas
6. Como conferir faturas
7. Como ver a prova de entrega
8. FAQ: "Quanto custa uma entrega?", "Quanto tempo demora?", "Como cancelo?"

**Formato**: Markdown com screenshots (placeholders). Linguagem simples e direta. Sem jargao tecnico. Cada guia < 10 min de leitura.

**G-041 | Help contextual e tooltips** (Score: 6)
Adicionar ajuda contextual nas interfaces:

**Tooltips em campos criticos**:
- Config > "Periodo de fechamento": "Define de quanto em quanto tempo o sistema calcula os ganhos dos motoboys (diario, semanal, mensal)"
- Config > "POD obrigatorio": "Quando ativado, motoboys precisam tirar foto e coletar assinatura para confirmar a entrega"
- Pricing > "Taxa por km": "Valor cobrado por quilometro rodado na entrega"
- Pricing > "Sobretaxa chuva": "Acrescimo percentual quando chove (ex: 20% = entrega de R$10 vira R$12)"

**Empty states educativos** (ja parciais, melhorar):
- Pedidos vazio: "Nenhum pedido ainda. Seus lojistas podem criar pedidos pelo app ou voce pode criar manualmente."
- Motoboys vazio: "Nenhum motoboy cadastrado. Convide seu primeiro motoboy [Convidar]."
- Mapa vazio: "Nenhum motoboy online. Quando motoboys ficarem online, aparecerao aqui no mapa."

**Links de ajuda**:
- Icone "?" no header de cada pagina → abre guia relevante
- Rodape: "Precisa de ajuda? [Guia de uso] [FAQ]"

---

## 4. Alivios e Criadores de Ganho

| Dor | Alivio |
|---|---|
| D-044 (central sem onboarding) | Wizard de 5 etapas no primeiro acesso. Checklist persistente. |
| D-045 (motoboy sem onboarding) | Tutorial de 5 telas. GPS permission. Explicacao de status. |
| D-046 (lojista sem onboarding) | Overlay guiado no primeiro pedido. Linha do tempo do fluxo. |
| D-047 (sem documentacao) | 3 guias completos em docs/guides/. FAQ por papel. |
| D-048 (sem help contextual) | Tooltips em campos criticos. Empty states educativos. Links de ajuda. |

| Ganho | Criador |
|---|---|
| G-037 (wizard central) | Configuracao em 5 min. Templates de pricing. Convite rapido de equipe. |
| G-038 (tutorial motoboy) | 1 min para entender tudo. GPS ativado no onboarding. Pronto para primeira entrega. |
| G-039 (guia lojista) | Primeiro pedido com confianca. Expectativas claras do fluxo. |
| G-040 (guias de uso) | Self-service. Reduz suporte humano. Disponivel 24/7. |
| G-041 (help contextual) | Aprendizado no momento certo. Zero frustacao com campos obscuros. |

---

## 5. Analise de concorrentes — Detalhamento Wave 6

### 5.1 iFood — Onboarding restaurante

**Wizard de cadastro**:
1. Dados do restaurante (nome, CNPJ, endereco)
2. Cardapio (categorias, itens, precos, fotos)
3. Horario de funcionamento
4. Dados bancarios para recebimento
5. Validacao (iFood revisa e aprova)

**Pos-cadastro**:
- Dashboard com checklist: "Complete seu perfil (80%)"
- Notificacoes push: "Adicione fotos aos seus pratos para vender mais"
- Central de ajuda integrada com chat

**O que aprender**: Checklist de progresso e poderoso. Gamifica o setup. "80% completo" motiva a completar.

### 5.2 Loggi — Onboarding entregador

**Fluxo de cadastro**:
1. Instalar app
2. Informar dados pessoais + telefone
3. Upload de documentos: CNH (frente e verso), selfie com documento, CRLV
4. Aguardar aprovacao (ate 48h)
5. Primeiro login: tutorial animado
6. Primeira entrega: guia step-by-step no app

**O que aprender**: Aprovacao assincrona para documentos e padrao. O motoboy cadastra e aguarda. Isso pode se aplicar ao Chega.la com self-registration (wave-4) + aprovacao do operador.

### 5.3 Entregas Expressas — Setup

**Wizard de configuracao**:
1. Dados da empresa
2. Tabela de precos (templates pre-configurados)
3. Cadastro de motoboys (individual ou planilha)
4. Cadastro de clientes/lojas
5. Teste: criar pedido de exemplo

**Documentacao**:
- Manual em PDF
- Videos tutoriais
- Blog com dicas
- Suporte via chat

**O que aprender**: "Criar pedido de exemplo" no wizard e brilhante. O operador ve o sistema funcionando antes de usar pra valer. Reduz medo de errar.

### 5.4 Rappi — Onboarding entregador

**Diferencial**: quiz de seguranca obrigatorio. Entregador precisa assistir video e responder perguntas sobre seguranca no transito antes de poder aceitar entregas. Garante que entregador entende regras basicas.

**O que aprender**: Conteudo obrigatorio pode ser irritante, mas garante qualidade. Para o Chega.la, um tutorial curto (< 1 min) e suficiente sem ser invasivo.

---

## 6. Priorizacao Wave 6

### Tier 1 — Critico (Score 8): DEVE estar na Wave 6

| Prioridade | O que | Score | Justificativa |
|---|---|---|---|
| 1 | **Onboarding Central** (D-044/G-037): wizard de config em 5 etapas | 8 | Primeira impressao do operador = decisao de adotar ou nao. |
| 2 | **Onboarding Motoboy** (D-045/G-038): tutorial de 5 telas + GPS | 8 | Motoboy que nao entende = motoboy perdido. Publico de baixa paciencia. |
| 3 | **Guias de uso** (D-047/G-040): 3 docs em docs/guides/ + FAQ | 8 | Self-service 24/7. Reduz custo de suporte. |

### Tier 2 — Importante (Score 6-7): Deve estar se possivel

| Prioridade | O que | Score | Justificativa |
|---|---|---|---|
| 4 | **Onboarding Lojista** (D-046/G-039): overlay guiado no primeiro pedido | 7 | Lojista mais paciente que motoboy, mas ainda precisa de guia. |
| 5 | **Help contextual** (D-048/G-041): tooltips + empty states + links de ajuda | 6 | Polimento. Melhora aprendizado continuo. |

### Impacto por perfil

| Perfil | Impacto na Wave 6 |
|---|---|
| Operador | Critico — wizard de config + guia completo da Central |
| Motoboy | Critico — tutorial de primeiro uso + guia do motoboy |
| Lojista | Alto — guia de primeira entrega + guia do lojista |
| Empresario | Alto — produto adotavel sem treinamento presencial |

---

## 7. Requisito transversal: UX/CX superior

### Wizard (Central)
- **Progresso visual**: barra de progresso ou stepper numerado (1/5, 2/5...)
- **Navegacao livre**: poder voltar a etapas anteriores
- **Salvar e continuar**: se fechar, retomar do mesmo ponto
- **Animacoes suaves**: transicoes entre etapas (slide horizontal)
- **Feedback positivo**: checkmark verde ao completar cada etapa
- **Pular opcional**: "Pular — farei isso depois" sem pressao

### Tutorial (Motoboy)
- **Maximo 5 telas**: menos e mais. Motoboy nao vai ler 10 telas.
- **Visual > texto**: icones grandes, frases curtas (max 2 linhas)
- **Swipe entre telas**: navegacao natural em mobile
- **Dots indicator**: bolinhas mostrando posicao (● ● ○ ○ ○)
- **Acao na ultima tela**: "Ficar online agora" = transicao direta para o app funcional
- **Skip**: sempre visivel para quem ja sabe

### Guias (docs/guides/)
- **Linguagem simples**: nivel 8o ano. Sem jargao.
- **Estrutura escaneavel**: headers claros, listas, negritos
- **Screenshots**: placeholder iniciais, substituir por reais
- **FAQ**: perguntas reais que usuarios fariam
- **Linkavel**: cada secao com ancora para deep link do app

### Help contextual
- **Tooltips discretos**: icone "?" pequeno ao lado do campo
- **Ativacao por hover (desktop) / tap (mobile)**
- **Texto curto**: max 2 linhas. Se precisar mais, link para guia.
- **Nao intrusivos**: nunca bloquear a acao do usuario

---

## 8. Fontes de pesquisa — Wave 6

### Onboarding
- [Wyzowl — User Onboarding Statistics 2024](https://www.wyzowl.com/user-onboarding-statistics/)
- [Appcues — Onboarding Best Practices](https://www.appcues.com/blog/user-onboarding-best-practices)
- [Product Led — Onboarding Benchmarks](https://productled.com/blog/user-onboarding-benchmarks)
- [UX Collective — Mobile Onboarding Patterns 2025](https://uxdesign.cc/)

### Concorrentes — onboarding
- [iFood — Portal do restaurante](https://portal.ifood.com.br/)
- [Loggi — Seja entregador](https://www.loggi.com/seja-entregador/)
- [Rappi — Soy Rappitendero](https://soy.rappi.com.br/)
- [Entregas Expressas — Como comecar](https://entregasexpressas.com.br)

### Documentacao de produto
- [Stripe Docs — Referencia de boa documentacao](https://stripe.com/docs)
- [Twilio — Guias por caso de uso](https://www.twilio.com/docs)
- [Write the Docs — Documentation Guide](https://www.writethedocs.org/guide/)

### Help contextual / tooltips
- [Radix UI — Tooltip](https://www.radix-ui.com/primitives/docs/components/tooltip)
- [shadcn/ui — Tooltip](https://ui.shadcn.com/docs/components/tooltip)
- [NNG — Tooltip Guidelines](https://www.nngroup.com/articles/tooltip-guidelines/)
