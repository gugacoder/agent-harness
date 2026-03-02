# Chega.la - User Stories Wave 6: Onboarding, Documentacao e Help Contextual

Historias de usuario para onboarding guiado, guias de uso e help contextual, agrupadas por perfil.

---

## Operador

### US001 - Configurar operacao no primeiro acesso

**Como** operador
**Quero** ser guiado por um wizard de configuracao inicial
**Para** configurar minha operacao em poucos minutos sem precisar de treinamento

**Criterios de Aceite:**
- [ ] Wizard exibido automaticamente no primeiro login
- [ ] 5 etapas: boas-vindas, dados empresa, pricing, convite equipe, conclusao
- [ ] Barra de progresso visivel (1/5, 2/5...)
- [ ] Botao "Pular" disponivel em etapas opcionais
- [ ] Checkmark verde ao completar cada etapa
- [ ] Ao finalizar, redirecionar para dashboard com checklist do que foi feito

**Requisitos:** OSD001, OSD002, OSD003, OSD004, OSD005, OSD006, OSD007, OSD008, OSD009, OSD010, OSD013, OSD014, OSD015

### US002 - Retomar wizard interrompido

**Como** operador
**Quero** retomar o wizard do ponto onde parei
**Para** nao precisar refazer etapas ja concluidas

**Criterios de Aceite:**
- [ ] Progresso salvo ao completar cada etapa
- [ ] Ao relogar, wizard reabre na etapa pendente
- [ ] Etapas concluidas marcadas com checkmark

**Requisitos:** OSD011

### US003 - Reexecutar wizard de configuracao

**Como** operador
**Quero** poder reacessar o wizard de configuracao
**Para** revisar ou alterar configuracoes iniciais

**Criterios de Aceite:**
- [ ] Opcao "Reexecutar configuracao inicial" em Configuracao
- [ ] Wizard abre mostrando estado atual (campos pre-preenchidos)
- [ ] Alteracoes salvas ao finalizar

**Requisitos:** OSD012

### US004 - Consultar guia de uso da Central

**Como** operador
**Quero** acessar um guia completo da Central
**Para** entender como usar cada funcionalidade sem precisar de suporte humano

**Criterios de Aceite:**
- [ ] Guia acessivel via menu principal
- [ ] Cobre todas as funcionalidades: dashboard, pedidos, motoboys, lojas, mapa, pricing, financeiro, analytics, config
- [ ] FAQ com perguntas reais (ex: "Motoboy nao aparece no mapa?")
- [ ] Linguagem simples, sem jargao tecnico

**Requisitos:** OSD060, OSD061, OSD066, OSD068

---

## Motoboy

### US010 - Entender o app no primeiro login

**Como** motoboy
**Quero** ver um tutorial rapido no primeiro login
**Para** entender como funciona o app em menos de 1 minuto

**Criterios de Aceite:**
- [ ] Tutorial de 5 telas exibido no primeiro login
- [ ] Navegacao por swipe horizontal
- [ ] Dots indicator mostrando posicao
- [ ] Botao "Pular" visivel em todas as telas
- [ ] Conteudo visual com icones grandes e frases curtas (max 2 linhas)

**Requisitos:** OSD020, OSD021, OSD024, OSD025, OSD027, OSD028, OSD031

### US011 - Ativar GPS durante onboarding

**Como** motoboy
**Quero** ser guiado para ativar minha localizacao
**Para** poder receber entregas assim que ficar online

**Criterios de Aceite:**
- [ ] Tela dedicada pedindo permissao GPS com explicacao empatica
- [ ] Botao "Ativar localizacao" dispara browser permission
- [ ] Se negado, exibe instrucao de como ativar nas configuracoes do celular
- [ ] Nao bloqueia o tutorial — pode prosseguir mesmo sem GPS

**Requisitos:** OSD022, OSD023

### US012 - Comecar a receber entregas apos tutorial

**Como** motoboy
**Quero** ficar online diretamente na ultima tela do tutorial
**Para** estar pronto para minha primeira entrega sem passos adicionais

**Criterios de Aceite:**
- [ ] Ultima tela exibe "Tudo certo!" com botao "Ficar online agora"
- [ ] Botao ativa status online e redireciona para StatusPage
- [ ] Tutorial nao reaparece em logins subsequentes

**Requisitos:** OSD026, OSD029

### US013 - Rever tutorial do app

**Como** motoboy
**Quero** poder rever o tutorial a qualquer momento
**Para** relembrar como funciona o app

**Criterios de Aceite:**
- [ ] Opcao "Rever tutorial" no menu de perfil
- [ ] Tutorial abre no mesmo formato do primeiro acesso

**Requisitos:** OSD030

### US014 - Consultar guia de uso do motoboy

**Como** motoboy
**Quero** acessar um guia com instrucoes detalhadas
**Para** resolver duvidas sem precisar de suporte

**Criterios de Aceite:**
- [ ] Guia acessivel via menu do app
- [ ] Cobre: login, status, entregas, POD, ganhos, perfil
- [ ] Secao troubleshooting ("Nao recebo entregas" → verificar status + GPS + conexao)
- [ ] FAQ com perguntas reais

**Requisitos:** OSD062, OSD063, OSD066, OSD067, OSD068

---

## Lojista

### US020 - Criar primeiro pedido com guia

**Como** lojista
**Quero** ser guiado no preenchimento do primeiro pedido
**Para** criar meu primeiro pedido com confianca e sem erros

**Criterios de Aceite:**
- [ ] Overlay guiado exibido no primeiro acesso a NovaEntregaPage
- [ ] Highlights sequenciais: endereco entrega → destinatario → botao confirmar
- [ ] Cada highlight com seta e tooltip explicativo
- [ ] Overlay nao reaparece em acessos subsequentes

**Requisitos:** OSD040, OSD041, OSD042, OSD043, OSD046

### US021 - Entender fluxo pos-pedido

**Como** lojista
**Quero** saber o que acontece apos criar um pedido
**Para** ter expectativas claras e nao ficar ansioso

**Criterios de Aceite:**
- [ ] Modal explicativo exibido apos ultimo step do overlay
- [ ] Timeline visual: Criado → Atribuido → Coletando → A caminho → Entregue
- [ ] Texto claro: "O operador atribui um motoboy. Voce acompanha tudo no mapa."

**Requisitos:** OSD044, OSD045

### US022 - Revisar guia "Como funciona"

**Como** lojista
**Quero** poder acessar o guia do fluxo a qualquer momento
**Para** relembrar como funciona o processo de entrega

**Criterios de Aceite:**
- [ ] Link "Como funciona" acessivel via menu
- [ ] Exibe mesmo conteudo do modal do overlay (timeline + explicacao)

**Requisitos:** OSD047

### US023 - Consultar guia de uso do lojista

**Como** lojista
**Quero** acessar um guia com instrucoes detalhadas
**Para** usar o app de forma autonoma

**Criterios de Aceite:**
- [ ] Guia acessivel via menu
- [ ] Cobre: login, criar pedido, enderecos, acompanhar, historico, faturas, POD
- [ ] FAQ com perguntas reais

**Requisitos:** OSD064, OSD065, OSD066, OSD068

---

## Todos os Perfis

### US030 - Consultar FAQ do meu papel

**Como** usuario de qualquer perfil
**Quero** acessar um FAQ especifico do meu papel
**Para** resolver duvidas rapidas sem ler o guia inteiro

**Criterios de Aceite:**
- [ ] FAQ acessivel via guia de uso ou link direto
- [ ] Perguntas reais agrupadas por tema
- [ ] Respostas objetivas em 2-3 frases

**Requisitos:** OSD066

### US031 - Entender campo de configuracao via tooltip

**Como** usuario de qualquer perfil
**Quero** ver explicacao ao lado de campos complexos
**Para** entender o impacto de cada configuracao sem sair da tela

**Criterios de Aceite:**
- [ ] Icone "?" ao lado de campos criticos
- [ ] Tooltip exibido por hover (desktop) ou tap (mobile)
- [ ] Texto curto (max 2 linhas)
- [ ] Link "Saiba mais" se explicacao for longa

**Requisitos:** OSD080, OSD081, OSD082, OSD088, RNF003

### US032 - Saber proximo passo via empty state

**Como** usuario de qualquer perfil
**Quero** que listas vazias me digam o que fazer
**Para** nao ficar perdido quando nao ha dados

**Criterios de Aceite:**
- [ ] Empty state com icone, titulo descritivo e instrucao
- [ ] CTA clicavel quando aplicavel (ex: "Convidar" em motoboys vazio)
- [ ] Mensagem especifica por contexto (pedidos vs motoboys vs mapa)

**Requisitos:** OSD083, OSD084, OSD085

### US033 - Acessar ajuda de qualquer pagina

**Como** usuario de qualquer perfil
**Quero** acessar ajuda relevante a partir de qualquer pagina
**Para** resolver duvidas no contexto em que estou

**Criterios de Aceite:**
- [ ] Icone "?" no header de cada pagina
- [ ] Click abre guia na secao relevante
- [ ] Rodape "Precisa de ajuda?" com links para guia e FAQ

**Requisitos:** OSD086, OSD087

---

## Rastreabilidade

| User Story | Requisitos OSD |
|------------|----------------|
| US001 | OSD001-OSD010, OSD013-OSD015 |
| US002 | OSD011 |
| US003 | OSD012 |
| US004 | OSD060, OSD061, OSD066, OSD068 |
| US010 | OSD020, OSD021, OSD024, OSD025, OSD027, OSD028, OSD031 |
| US011 | OSD022, OSD023 |
| US012 | OSD026, OSD029 |
| US013 | OSD030 |
| US014 | OSD062, OSD063, OSD066, OSD067, OSD068 |
| US020 | OSD040-OSD043, OSD046 |
| US021 | OSD044, OSD045 |
| US022 | OSD047 |
| US023 | OSD064, OSD065, OSD066, OSD068 |
| US030 | OSD066 |
| US031 | OSD080-OSD082, OSD088, RNF003 |
| US032 | OSD083-OSD085 |
| US033 | OSD086, OSD087 |
