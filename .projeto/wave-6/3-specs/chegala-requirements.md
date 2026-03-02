# Chega.la - Requisitos Wave 6: Onboarding, Documentacao e Help Contextual

Requisitos funcionais e nao funcionais para onboarding guiado (3 apps), guias de uso por papel e help contextual.

---

## Onboarding Central (Wizard)

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD001 | O sistema deve exibir wizard de configuracao inicial no primeiro acesso do operador |
| OSD002 | O sistema deve apresentar tela de boas-vindas com animacao do fluxo de entrega (pedido → motoboy → entrega) |
| OSD003 | O sistema deve permitir preenchimento de dados da empresa (nome, telefone, endereco, logo) na etapa 2 |
| OSD004 | O sistema deve utilizar autocomplete de endereco no campo de endereco da empresa |
| OSD005 | O sistema deve oferecer template pre-configurado de tabela de precos (preco por km) com valores sugeridos |
| OSD006 | O sistema deve permitir ajuste dos valores do template ou aceitar defaults |
| OSD007 | O sistema deve exibir simulador rapido de preco (ex: "Entrega de 5km = R$ X") na etapa de pricing |
| OSD008 | O sistema deve permitir convite de motoboy por telefone ou email na etapa de equipe |
| OSD009 | O sistema deve permitir convite de lojista por telefone ou email na etapa de equipe |
| OSD010 | O sistema deve oferecer opcao "Pular — farei isso depois" em etapas nao obrigatorias |
| OSD011 | O sistema deve salvar progresso do wizard e retomar do mesmo ponto se o operador sair |
| OSD012 | O sistema deve permitir reacessar o wizard em Configuracao > "Reexecutar configuracao inicial" |
| OSD013 | O sistema deve exibir barra de progresso ou stepper numerado (1/5, 2/5...) |
| OSD014 | O sistema deve permitir navegar para etapas anteriores do wizard |
| OSD015 | O sistema deve exibir checkmark verde ao completar cada etapa |

---

## Onboarding Motoboy (Tutorial)

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD020 | O sistema deve exibir tutorial de 5 telas no primeiro login do motoboy |
| OSD021 | O sistema deve apresentar tela de boas-vindas com animacao de motoboy no mapa |
| OSD022 | O sistema deve solicitar permissao de geolocalizacao com explicacao empatica na tela 2 |
| OSD023 | O sistema deve exibir instrucao alternativa de como ativar GPS nas configuracoes do celular se permissao negada |
| OSD024 | O sistema deve mostrar 3 passos visuais do fluxo (ficar online → aceitar entrega → confirmar com POD) |
| OSD025 | O sistema deve explicar toggle online/offline com indicadores visuais (verde = online, vermelho = offline) |
| OSD026 | O sistema deve oferecer botao "Ficar online agora" na ultima tela, ativando status e redirecionando para StatusPage |
| OSD027 | O sistema deve permitir skip em qualquer tela do tutorial |
| OSD028 | O sistema deve exibir dots indicator de progresso (posicao nas 5 telas) |
| OSD029 | O sistema deve mostrar tutorial apenas no primeiro login do motoboy |
| OSD030 | O sistema deve disponibilizar "Rever tutorial" no menu de perfil do motoboy |
| OSD031 | O sistema deve permitir navegacao entre telas por swipe horizontal |

---

## Onboarding Lojista (Overlay Guiado)

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD040 | O sistema deve exibir overlay guiado no primeiro acesso do lojista a NovaEntregaPage |
| OSD041 | O sistema deve destacar campo "Endereco de entrega" com seta e tooltip explicativo |
| OSD042 | O sistema deve destacar campos de destinatario (nome e telefone) com instrucao |
| OSD043 | O sistema deve destacar botao de confirmacao com instrucao "Confirme e pronto!" |
| OSD044 | O sistema deve exibir modal explicativo do fluxo pos-pedido |
| OSD045 | O sistema deve mostrar timeline visual do fluxo (Criado → Atribuido → Coletando → A caminho → Entregue) |
| OSD046 | O sistema deve exibir overlay apenas no primeiro acesso do lojista |
| OSD047 | O sistema deve disponibilizar link "Como funciona" no menu do lojista |

---

## Documentacao (Guias de Uso)

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD060 | O sistema deve disponibilizar guia do operador acessivel via menu da Central |
| OSD061 | O guia do operador deve cobrir: dashboard, pedidos, motoboys, lojas, mapa, pricing, financeiro, analytics, configuracao |
| OSD062 | O sistema deve disponibilizar guia do motoboy acessivel via menu do app |
| OSD063 | O guia do motoboy deve cobrir: login, status, entregas, aceitar/recusar, navegacao, POD, ganhos, perfil, problemas comuns |
| OSD064 | O sistema deve disponibilizar guia do lojista acessivel via menu do app |
| OSD065 | O guia do lojista deve cobrir: login, criar pedido, enderecos salvos, acompanhar, historico, faturas, POD |
| OSD066 | O sistema deve incluir secao FAQ em cada guia com perguntas reais por papel |
| OSD067 | O sistema deve incluir secao de troubleshooting no guia do motoboy |
| OSD068 | O sistema deve utilizar linguagem simples (nivel 8o ano) sem jargao tecnico nos guias |

---

## Help Contextual

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD080 | O sistema deve exibir tooltip no campo "Periodo de fechamento" explicando impacto (diario, semanal, mensal) |
| OSD081 | O sistema deve exibir tooltip no campo "POD obrigatorio" explicando comportamento |
| OSD082 | O sistema deve exibir tooltip em campos de pricing (taxa/km, sobretaxa chuva, etc.) |
| OSD083 | O sistema deve exibir empty state educativo em lista de pedidos vazia com instrucao do proximo passo |
| OSD084 | O sistema deve exibir empty state educativo em lista de motoboys vazia com CTA "Convidar" |
| OSD085 | O sistema deve exibir empty state educativo no mapa quando nenhum motoboy online |
| OSD086 | O sistema deve exibir icone "?" no header de cada pagina linkando ao guia relevante |
| OSD087 | O sistema deve exibir rodape "Precisa de ajuda?" com links para guia e FAQ |
| OSD088 | O sistema deve ativar tooltips por hover (desktop) e tap (mobile) |

---

## RNF - Requisitos Nao Funcionais

| ID | Requisito |
|----|-----------|
| RNF001 | O wizard do operador deve ser completavel em menos de 5 minutos |
| RNF002 | O tutorial do motoboy deve ter no maximo 5 telas |
| RNF003 | Tooltips devem ter no maximo 2 linhas de texto; se precisar mais, linkar para guia |
| RNF004 | Guias de uso devem ter menos de 10 minutos de leitura cada |
| RNF005 | Transicoes entre etapas do wizard e telas do tutorial devem completar em menos de 300ms |
| RNF006 | Help contextual nao deve bloquear a acao do usuario |
| RNF007 | Progresso do onboarding deve persistir entre sessoes (crash-safe) |
| RNF008 | Guias devem ser indexaveis por deep link para referencia direta de secoes |

---

## Matriz de Permissoes

| Funcionalidade | operator | shop | courier |
|----------------|----------|------|---------|
| Ver wizard de config | Sim | - | - |
| Reexecutar wizard | Sim | - | - |
| Ver tutorial motoboy | - | - | Sim |
| Rever tutorial | - | - | Sim |
| Ver overlay lojista | - | Sim | - |
| Acessar guia do operador | Sim | - | - |
| Acessar guia do lojista | - | Sim | - |
| Acessar guia do motoboy | - | - | Sim |
| Ver tooltips help | Sim | Sim | Sim |
| Acessar FAQ | Sim | Sim | Sim |

---

## Rastreabilidade

| Modulo | Requisitos |
|--------|------------|
| Onboarding Central (Wizard) | OSD001-OSD015 |
| Onboarding Motoboy (Tutorial) | OSD020-OSD031 |
| Onboarding Lojista (Overlay) | OSD040-OSD047 |
| Documentacao (Guias) | OSD060-OSD068 |
| Help Contextual | OSD080-OSD088 |
| Nao Funcionais | RNF001-RNF008 |
