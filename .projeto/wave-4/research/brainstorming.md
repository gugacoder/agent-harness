# Brainstorming Wave 4 — Chega.la

**Data**: 2026-03-02
**Foco**: Seguranca, RBAC, Super Admin, Login Avancado (OTP WhatsApp/Email), Gestao de Perfil, Avatar Rico
**Base**: Wave-3 ranking (44 discoveries, 29 implementadas, 13 nao implementadas, 2 parciais)
**Tema**: Fundacao de Acesso — quem acessa, como acessa, como se identifica

---

## 1. Contexto — O que mudou desde a wave 3

### 1.1 Estado do produto

O Chega.la saiu das waves 1-2 com ciclo operacional completo (pedidos, entregas, pricing, financeiro, POD, analytics) e 3 PWAs sincronizados via SSE. A wave-3 avaliou o produto e recomendou STOP para features operacionais (diminishing returns).

Porem, uma analise critica do **acesso e identidade** revela gaps fundamentais que nao foram cobertos nas waves anteriores:

| Area | Estado atual | Gap |
|---|---|---|
| Login | Email + senha apenas | Sem OTP, sem alternativa moderna |
| Registro | Invite do operador apenas | Sem self-registration, workflow rigido |
| RBAC | 3 roles fixos (operator/shop/courier) | Sem permissoes granulares, sem verificacao por rota |
| Super admin | Inexistente | Nenhum acesso cross-company |
| Perfil | Read-only (dados do JWT) | Sem edicao, sem tela de perfil |
| Avatar | Campo `avatar_url` no schema | Sem upload, sem crop, sem UI |
| Gestao de times | Invite + lista basica | Sem CRUD completo, sem desativar/reativar, sem detalhes |
| Seguranca de rotas | authMiddleware + companyMiddleware | Sem role-check por endpoint, curl bypassa regras de UI |

**Conclusao**: O produto tem um motor operacional solido, mas a "porta de entrada" (login, perfil, seguranca) e subdesenvolvida. Um produto Ready-to-Market nao pode ter login basico, zero gestao de perfil, e seguranca incompleta.

### 1.2 Mercado em marco 2026 — Autenticacao e Seguranca

**Tendencias de login em apps de delivery 2026:**

- **OTP e o padrao de facto**: Loggi, iFood, 99, Rappi, Lalamove — todos usam OTP via SMS ou WhatsApp como metodo primario de login. Email + senha e fallback, nao primario.
- **WhatsApp como canal dominante**: 99% dos brasileiros com smartphone usam WhatsApp. OTP via WhatsApp e mais barato que SMS (zero custo com Evolution API self-hosted) e tem taxa de entrega superior.
- **Passwordless trend**: Tendencia global de eliminar senhas. Apple, Google, Microsoft promovem passkeys. Apps de delivery adotam login por telefone + OTP como unico metodo.
- **Magic link por email**: Alternativa ao OTP para usuarios corporativos. Clerk, Auth0, Supabase suportam nativamente.
- **Multi-tenant security**: SaaS de delivery como Entregas Expressas e SyLog isolam dados por empresa. Super admin e padrao para gestao da plataforma.

**Referencia competitiva — Login:**

| App | Metodo primario | Alternativas | Self-registration |
|---|---|---|---|
| **Loggi** | Telefone + OTP SMS | Email + senha | Sim (motoboy via app) |
| **iFood** | Telefone + OTP SMS | Google, Apple, email | Sim (lojista via portal, motoboy via app) |
| **99Entrega** | Telefone + OTP SMS | — | Sim |
| **Lalamove** | Telefone + OTP SMS | — | Sim (lojista + motoboy) |
| **Rappi** | Telefone + OTP WhatsApp/SMS | Google, Apple | Sim |
| **Entregas Expressas** | Email + senha | — | Sim (convite do operador) |
| **Chega.la (atual)** | Email + senha | — | Nao (apenas invite) |

**Gap critico**: O Chega.la e o unico app da tabela que NAO oferece login por telefone/OTP. E o unico que NAO permite self-registration. Esta 2 geracoes atras dos concorrentes em experiencia de login.

**Referencia competitiva — Perfil e Avatar:**

| App | Edicao de perfil | Avatar | Upload |
|---|---|---|---|
| **Loggi** | Nome, telefone, veiculo, CNH | Foto com crop | Camera + galeria |
| **iFood** | Nome, email, telefone, endereco | Foto com crop circular | Camera + galeria |
| **99** | Nome, foto, veiculo, documentos | Crop circular | Camera + galeria |
| **Lalamove** | Nome, telefone, veiculo | Foto | Camera + galeria |
| **Rappi** | Nome, telefone, email | Crop circular | Camera + galeria |
| **Chega.la (atual)** | Nenhuma | Nenhum | Nenhum |

**Gap critico**: Zero gestao de perfil. O usuario nao pode nem mudar seu nome. Todos os concorrentes oferecem edicao completa + avatar com crop.

**Referencia competitiva — Seguranca e Papeis:**

| App | RBAC | Super admin | Rate limiting |
|---|---|---|---|
| **Entregas Expressas** | Admin, operador, motoboy, lojista | Sim (gestor plataforma) | Sim |
| **SyLog** | Admin, operador, motorista, cliente | Sim | Sim |
| **iFood** | Restaurante owner, gerente, atendente, entregador | Sim (iFood internal) | Sim |
| **Chega.la (atual)** | operator, shop, courier (fixo) | Nao | Nao |

---

## 2. Novas dores identificadas (Wave 4)

### 2.1 Seguranca

**D-027 | Rotas API sem verificacao de papel (Role Check)** (Score: 9)
O authMiddleware valida JWT e o companyMiddleware isola por tenant, mas NENHUM endpoint verifica o `role` do usuario. Um motoboy autenticado pode chamar `POST /api/orders` (criar pedido — funcao de lojista), `POST /api/shops` (criar loja — funcao de operador), ou `PATCH /api/company/config` (alterar config — funcao de admin). Basta um `curl` com token valido. A UI esconde essas acoes por papel, mas a API esta completamente aberta. Isso e uma vulnerabilidade de seguranca critica: qualquer usuario autenticado pode executar qualquer operacao da empresa.
- **Impacto**: Alto. Motoboy pode criar pedidos fantasma, alterar precos, fechar financeiro.
- **Referencia**: OWASP A01:2021 Broken Access Control. Todos os concorrentes implementam RBAC no backend.

**D-028 | Sem super admin / acesso cross-company** (Score: 8)
Nao existe papel de administrador da plataforma. Se o sistema tiver 10 empresas, nao ha como um admin ver dados de todas, diagnosticar problemas, ou gerenciar a plataforma como um todo. Toda operacao e scoped a uma company. Para resolver qualquer issue, e preciso acessar diretamente o banco de dados. Concorrentes SaaS sempre tem um super admin.
- **Impacto**: Alto para operacao da plataforma. Medio para seguranca.

**D-029 | Sem gestao de times e usuarios** (Score: 8)
O operador pode convidar usuarios via `POST /auth/invite`, mas nao pode: editar dados de um usuario, desativar/reativar, mudar o papel, ver detalhes completos, resetar senha. A lista de motoboys (MotoboysPage) e lojistas (LojistasPage) mostra dados basicos, mas sem acoes de gestao real. Nao ha tela unificada de "Usuarios da empresa". Qualquer gestao de times requer acesso direto ao banco.
- **Impacto**: Alto. Empresa nao consegue gerir seu proprio time pelo app.

### 2.2 Login

**D-030 | Login apenas email + senha — atrito e abandono** (Score: 9)
O unico metodo de login e email + senha via Supabase `signInWithPassword`. Num mercado onde Loggi, iFood, 99, Rappi e Lalamove usam telefone + OTP como metodo primario, o Chega.la exige que motoboys (que frequentemente trocam de aparelho e esquecem senhas) memorizem um email e senha. Resultado previsivel: abandono no primeiro obstaculo. Motoboys estao acostumados com "digitar telefone, receber codigo, entrar". Email + senha e do seculo passado para esse publico.
- **Impacto**: Critico para adocao. Motoboy que nao consegue logar = motoboy perdido.
- **Referencia**: [Clerk 2026 — Passwordless Auth Trends](https://clerk.com/blog), [Auth0 — OTP Best Practices](https://auth0.com/docs/authenticate)

**D-031 | Sem self-registration — dependencia total do operador** (Score: 7)
Um motoboy novo so pode acessar o sistema se o operador enviar um convite por email. Isso cria um gargalo: operador precisa parar o que esta fazendo, abrir a Central, preencher dados, enviar invite. O motoboy precisa verificar email (muitos nao usam email regularmente), aceitar convite, definir senha. Fluxo longo e fragil. Concorrentes permitem que motoboys baixem o app e se cadastrem, com aprovacao posterior do operador.
- **Impacto**: Medio. Gargalo operacional, nao bloqueante.

### 2.3 Perfil e Identidade

**D-032 | Sem edicao de perfil — usuario preso aos dados iniciais** (Score: 8)
Uma vez criado, o usuario nao pode alterar nome, telefone, email, ou qualquer dado pessoal. Nao existe rota `PATCH /api/profiles/me` nem tela de edicao. Se o motoboy mudou de telefone, o operador precisa ir ao banco de dados. Se o lojista quer corrigir o nome da loja, precisa pedir ao operador. Zero autonomia do usuario sobre seus proprios dados.
- **Impacto**: Alto. Frustracao basica. Qualquer app moderno permite editar perfil.

**D-033 | Sem avatar — identidade visual inexistente** (Score: 7)
O campo `avatar_url` existe na tabela `profiles` e `photo_url` em `couriers`, mas nao ha: tela de upload, componente de crop, integracao com storage, fallback com iniciais. Todos os usuarios aparecem como circulos cinza genéricos. Num app onde motoboys sao a cara da operacao (lojista quer saber quem esta entregando), a ausencia de foto e uma falha de confianca.
- **Impacto**: Medio. UX e confianca. Concorrentes todos tem foto com crop.
- **Referencia**: [react-easy-crop](https://github.com/ValentinH/react-easy-crop), [Cropper.js](https://fengyuanchen.github.io/cropperjs/)

### 2.4 Configuracao de canais de autenticacao

**D-034 | Sem configuracao de canais OTP** (Score: 7)
Mesmo que OTP seja implementado, nao existe area para configurar: instancia do Evolution API (WhatsApp), parametros SMTP (email), ativacao/desativacao de cada canal. Um produto SaaS multi-tenant precisa que cada empresa configure seus proprios canais de notificacao. Sem isso, OTP fica hardcoded para uma unica instancia, sem flexibilidade.
- **Impacto**: Medio. Infra necessaria para OTP funcionar em producao multi-tenant.

---

## 3. Novos ganhos identificados (Wave 4)

### 3.1 Seguranca

**G-022 | RBAC granular com middleware de role-check** (Score: 9)
Middleware que verifica `role` do JWT contra roles permitidos em cada endpoint. Implementacao: decorador/guard `requireRole('operator')` antes de cada rota. Matriz de permissoes:

| Endpoint | operator | shop | courier | super_admin |
|---|---|---|---|---|
| POST /orders | - | ✅ | - | ✅ |
| GET /orders | ✅ | ✅ (proprios) | ✅ (atribuidos) | ✅ |
| POST /shops | ✅ | - | - | ✅ |
| PATCH /company/config | ✅ | - | - | ✅ |
| POST /auth/invite | ✅ | - | - | ✅ |
| POST /deliveries/:id/accept | - | - | ✅ | ✅ |
| GET /analytics | ✅ | - | - | ✅ |
| GET /financial | ✅ | - | - | ✅ |

- **Referencia**: Hono middleware pattern, Express RBAC middleware.

**G-023 | Super admin com acesso cross-company** (Score: 8)
Papel `super_admin` no JWT (app_metadata.role = 'super_admin'). Nao vinculado a nenhuma company. Pode: listar todas as empresas, acessar dados de qualquer empresa, criar/desativar empresas, ver metricas globais, diagnosticar problemas. UI separada ou toggle no Central. Nao precisa de app dedicado — pode ser uma area especial na Central.
- **Referencia**: Entregas Expressas admin panel, SyLog gestao plataforma.

**G-024 | Gestao completa de usuarios e times** (Score: 8)
Tela na Central: lista todos os usuarios da empresa com filtros (role, status, busca). Acoes: editar dados, desativar/reativar, mudar papel, resetar senha (enviar email), ver historico de atividade. Grid responsivo com avatar, nome, role badge, status badge, ultima atividade. Acao em massa: desativar multiplos.
- **Referencia**: Clerk user management, Auth0 dashboard.

### 3.2 Login

**G-025 | Login via OTP WhatsApp (Evolution API)** (Score: 9)
Fluxo: usuario digita telefone → backend envia codigo de 6 digitos via Evolution API → usuario digita codigo → autenticado. Sem senha. Sem email. Telefone e o identificador primario.

Detalhamento tecnico:
1. Frontend: tela com input de telefone (mascara brasileira), botao "Enviar codigo"
2. Backend: `POST /auth/otp/send` — gera codigo 6 digitos, salva hash+expiry (5min), envia via Evolution API
3. Evolution API: `POST /message/sendText` com instancia configurada pela empresa
4. Frontend: tela com input OTP (6 digitos, auto-focus, colar do clipboard)
5. Backend: `POST /auth/otp/verify` — valida codigo, emite JWT via Supabase admin
6. Configuracao: na area de config da Central, campo para URL + API key da instancia Evolution

**Tratamento de erros**: rate limit (3 tentativas/minuto), expiracao (5 min), feedback claro ("codigo invalido", "codigo expirado", "enviar novamente").

**UX de referencia**: tela de login do iFood — campo telefone com bandeira BR, teclado numerico, timer de reenvio.
- **Referencia**: [Evolution API — Send Message](https://doc.evolution-api.com/), iFood login flow, Rappi login flow.

**G-026 | Login via OTP Email (SMTP)** (Score: 7)
Mesmo fluxo do WhatsApp, mas via email. Para usuarios que preferem email (operadores, lojistas corporativos). Backend envia email com codigo via SMTP da empresa.

Configuracao SMTP:
1. Host, porta, usuario, senha
2. **Autodetect TLS/SSL**: backend tenta conexao com TLS, se falha tenta sem, salva configuracao que funcionou
3. **Email de teste**: botao "Enviar email de teste" que envia para o email do operador e confirma recebimento
4. Template do email: logo da empresa, codigo em destaque, expiracao

- **Referencia**: Nodemailer (Node.js), config pattern do WordPress SMTP.

### 3.3 Perfil

**G-027 | Edicao completa de perfil** (Score: 8)
Tela em cada app: "Meu Perfil". Campos editaveis: nome completo, telefone, email (com verificacao). Para motoboy: tambem veiculo, placa, CNH. Para lojista: tambem nome da loja, endereco, horario de funcionamento.

Fluxo de atualizacao:
1. Frontend: formulario pre-preenchido com dados atuais
2. Backend: `PATCH /api/profiles/me` — atualiza profile + Supabase user_metadata
3. Validacao: telefone unico por empresa, email unico global
4. Feedback: toast de sucesso, erros inline

- **Referencia**: iFood perfil do restaurante, Loggi perfil do entregador.

**G-028 | Avatar com upload e crop rico** (Score: 7)
Componente de avatar em cada app:
1. **Trigger**: clique no avatar atual (ou placeholder com iniciais)
2. **Fonte**: camera (mobile) ou galeria/arquivo (desktop)
3. **Formatos suportados**: JPEG, PNG, WebP, HEIC (iOS), HEIF, BMP, TIFF — conversao automatica para WebP no frontend
4. **Crop**: area circular interativa com zoom e pan (react-easy-crop)
5. **Compressao**: max 500KB apos crop, resize para 512x512
6. **Upload**: para Supabase Storage (bucket `avatars`), URL salva em `profiles.avatar_url`
7. **Fallback**: componente que mostra iniciais + cor derivada do nome quando sem avatar

Fluxo:
```
[Clique avatar] → [Selecionar fonte] → [Preview + Crop circular] → [Confirmar] → [Upload + Salvar] → [Avatar atualizado]
```

- **Referencia**: react-easy-crop (MIT, 3K+ stars), browser-image-compression, Supabase Storage JS client.

### 3.4 Configuracao

**G-029 | Configuracao de canais OTP no admin** (Score: 7)
Secao na ConfiguracaoPage da Central:

**WhatsApp (Evolution API):**
- Toggle ativar/desativar
- URL da instancia Evolution
- API Key
- Numero de origem (exibicao)
- Botao "Testar conexao" → envia mensagem de teste para o numero do operador

**Email (SMTP):**
- Toggle ativar/desativar
- Host SMTP
- Porta (sugestao: 587)
- Usuario
- Senha (campo password, nunca exibida apos salvar)
- Remetente (email from)
- **Autodetect TLS/SSL**: botao "Detectar" que testa conexao com TLS e sem TLS, salva o que funcionar
- Botao "Enviar email de teste" → envia para o email do operador logado
- Status: badge verde "Configurado" / vermelho "Nao configurado"

Backend:
- `PATCH /api/company/config` com campos novos (otp_whatsapp_*, otp_smtp_*)
- Credenciais armazenadas encrypted at rest
- Endpoint de teste: `POST /api/company/config/test-smtp` e `POST /api/company/config/test-whatsapp`

---

## 4. Alivios — Como o Chega.la pode aliviar as novas dores

| ID | Dor que alivia | Como alivia |
|---|---|---|
| A-017 | D-027 (sem role-check) | Middleware `requireRole()` em TODAS as rotas protegidas. Matriz de permissoes documentada. Testes automatizados de seguranca. |
| A-018 | D-028 (sem super admin) | Role `super_admin` no JWT. Bypass de company filter. UI de gestao de plataforma na Central. |
| A-019 | D-029 (sem gestao times) | Tela completa de gestao de usuarios na Central: listar, editar, desativar, resetar senha, filtrar por role/status. |
| A-020 | D-030 (login email+senha) | OTP via WhatsApp (G-025) como metodo primario. Telefone como identificador. Zero senha para motoboys. |
| A-021 | D-031 (sem self-registration) | Formulario de auto-cadastro no app motoboy/lojista com aprovacao posterior do operador. |
| A-022 | D-032 (sem edicao perfil) | `PATCH /api/profiles/me` + tela "Meu Perfil" em cada app. |
| A-023 | D-033 (sem avatar) | Componente de upload + crop + compressao + Supabase Storage. |
| A-024 | D-034 (sem config OTP) | Secao de configuracao na Central com teste de conexao. |

---

## 5. Criadores de Ganho — Como o Chega.la cria valor positivo

| ID | Ganho que potencializa | Como cria |
|---|---|---|
| CG-014 | G-022 (RBAC) | Guard por rota. Mensagem de erro clara ("Voce nao tem permissao"). Log de tentativas bloqueadas. |
| CG-015 | G-023 (super admin) | Dashboard com lista de empresas, metricas globais, health check. Impersonar empresa para debug. |
| CG-016 | G-024 (gestao usuarios) | Grid com avatar, nome, role badge, status. Acoes inline. Busca e filtros. |
| CG-017 | G-025 (OTP WhatsApp) | Tela minimalista: telefone → codigo → dentro. Timer de reenvio. Experiencia iFood-like. |
| CG-018 | G-026 (OTP Email) | Email bonito com logo da empresa e codigo em destaque. Fallback quando WhatsApp indisponivel. |
| CG-019 | G-027 (perfil editavel) | Formulario pre-preenchido. Atualizacao instantanea. Feedback visual de sucesso. |
| CG-020 | G-028 (avatar crop) | Crop circular interativo com zoom. Preview em tempo real. Compressao automatica. Multi-formato. |
| CG-021 | G-029 (config OTP) | Setup wizard passo-a-passo. Teste de conexao com feedback verde/vermelho. Autodetect TLS. |

---

## 6. Analise de concorrentes — Detalhamento Wave 4

### 6.1 Loggi — Login e Perfil

**Login**: Telefone + OTP SMS. Fluxo: digita telefone → recebe SMS → digita codigo → entra. Sem senha. Para entregadores, o app pede documentos (CNH, CRLV) no primeiro acesso.

**Perfil do entregador**: Nome, foto (com crop circular), tipo de veiculo (moto, bicicleta, carro), placa, CNH (upload de foto). Status de documentos (pendente, aprovado, rejeitado). Centro de ganhos detalhado.

**Seguranca**: Multi-tenant (Loggi opera como plataforma, nao multi-empresa). Roles: entregador, lojista (via portal web), admin interno. API protegida com rate limiting e abuse detection.

**O que aprender**: Onboarding do entregador com upload de documentos e aprovacao assincrona. Login por telefone e identidade natural do motoboy (nao email).

### 6.2 iFood — Login e Seguranca

**Login restaurante**: Email + senha ou Google SSO. Portal web para gestao. App para acompanhamento.

**Login entregador**: Telefone + OTP SMS. Cadastro pede: nome, CPF, foto 3x4, CNH, CRLV, comprovante de endereco. Aprovacao em ate 48h.

**Perfil**: Edicao completa. Foto com crop. Documentos com status de validacao. Area de configuracao de disponibilidade.

**Seguranca**: Roles: restaurante_owner, gerente, atendente, entregador. Permissoes granulares (gerente nao vê financeiro). API com OAuth 2.0, rate limiting agressivo, CORS restrito.

**O que aprender**: Separacao clara de permissoes dentro de uma mesma empresa (owner vs gerente vs atendente). Validacao de documentos como barreira de entrada para motoboys.

### 6.3 99Entrega — Simplicidade

**Login**: Telefone + OTP SMS. Unico metodo. Ultra simples.

**Perfil**: Minimalista — nome, foto, veiculo. Foco em "comece a entregar rapido".

**Seguranca**: Verificacao de identidade por selfie + documento (liveness check). Bloqueio automatico por inatividade.

**O que aprender**: Simplicidade extrema no login. Motoboy quer comecar a ganhar dinheiro, nao preencher formularios. Cada campo a mais e um abandono potencial.

### 6.4 Lalamove — Multi-pais

**Login**: Telefone + OTP SMS/WhatsApp (varia por pais). No Brasil, SMS.

**Perfil**: Nome, foto, tipo de veiculo, documentos. Troca de veiculo disponivel.

**Seguranca**: Multi-tenant por cidade/pais. Roles: cliente (lojista), motorista. Sem admin visivel (Lalamove opera como plataforma).

**O que aprender**: OTP por WhatsApp em paises onde WhatsApp domina. Custo zero vs SMS pago.

### 6.5 Entregas Expressas — O concorrente direto

**Login**: Email + senha (como o Chega.la atual). Nao oferecem OTP.

**Perfil**: Edicao basica. Sem crop de avatar sofisticado.

**Seguranca**: Admin, operador, motoboy, lojista. Permissoes por area (financeiro, operacional, cadastros).

**O que aprender**: Este e o concorrente mais proximo e NAO tem OTP. Implementar OTP no Chega.la seria um diferencial direto sobre o principal concorrente. Alem disso, o Chega.la pode ter RBAC superior com middleware granular.

---

## 7. Priorizacao Wave 4

### 7.1 Tier 1 — Critico (Score 8-9): DEVE estar na Wave 4

| Prioridade | O que | Score | Justificativa |
|---|---|---|---|
| 1 | **RBAC granular** (D-027/G-022): middleware requireRole() em todas as rotas + testes | 9 | Vulnerabilidade de seguranca. Qualquer usuario pode executar qualquer operacao. Risco critico. |
| 2 | **Login OTP WhatsApp** (D-030/G-025): telefone + codigo via Evolution API | 9 | Atrito de login e a maior causa de abandono. Motoboys nao usam email. |
| 3 | **Super admin** (D-028/G-023): role cross-company + UI basica de gestao | 8 | Necessario para operar a plataforma. Sem ele, tudo via banco de dados. |
| 4 | **Gestao de usuarios** (D-029/G-024): CRUD completo na Central | 8 | Empresa precisa gerir seu time. Sem isso, gestao e manual. |
| 5 | **Edicao de perfil** (D-032/G-027): tela "Meu Perfil" em cada app + PATCH API | 8 | Autonomia basica do usuario. Todos os concorrentes tem. |

### 7.2 Tier 2 — Importante (Score 7): Deve estar se possivel

| Prioridade | O que | Score | Justificativa |
|---|---|---|---|
| 6 | **Avatar com crop** (D-033/G-028): upload + crop circular + compressao | 7 | Identidade visual. Confianca do lojista ao ver foto do motoboy. |
| 7 | **OTP Email** (G-026): SMTP configuravel + autodetect TLS | 7 | Alternativa ao WhatsApp para operadores e lojistas corporativos. |
| 8 | **Config canais OTP** (D-034/G-029): tela de configuracao WhatsApp + SMTP | 7 | Infraestrutura para OTP funcionar em producao multi-tenant. |
| 9 | **Self-registration** (D-031): cadastro com aprovacao posterior | 7 | Reduz gargalo de onboarding. Concorrentes oferecem. |

### 7.3 Impacto por perfil

| Perfil | Impacto na Wave 4 |
|---|---|
| Empresario | Alto — RBAC protege dados, super admin gerencia plataforma, gestao de times |
| Operador | Alto — gestao de usuarios, configuracao de OTP |
| Motoboy | Critico — OTP WhatsApp elimina atrito de login, edicao de perfil, avatar |
| Lojista | Alto — OTP email como alternativa, edicao de perfil |

---

## 8. Requisito transversal: UX/CX superior

Todas as features desta wave devem seguir o padrao de **UX/CX superior a concorrentes**:

### Login OTP
- Animacao suave entre tela de telefone e tela de codigo
- Teclado numerico automatico (inputmode="numeric")
- Auto-detect de codigo colado (Credential Management API / OTP autofill)
- Timer visual de reenvio (countdown circular)
- Mensagem de erro empática ("Codigo expirado. Enviamos um novo!")
- Loading state no botao (spinner, nao travar tela)

### Gestao de Perfil
- Formulario com validacao em tempo real (nao so no submit)
- Mascara de telefone brasileira automatica
- Preview de alteracoes antes de salvar
- Toast de confirmacao ("Perfil atualizado com sucesso")
- Skeleton loading enquanto carrega dados

### Avatar
- Crop com gestos touch (pinch zoom em mobile)
- Preview circular em tempo real durante o crop
- Indicacao de tamanho maximo de forma amigavel ("Imagem muito grande. Reduzindo automaticamente...")
- Placeholder com iniciais + cor unica derivada do nome (deterministico)
- Transicao suave entre placeholder e foto carregada

### Gestao de Usuarios
- Grid responsivo com cards em mobile, tabela em desktop
- Busca em tempo real (debounce 300ms)
- Filtros combinaveis (role + status)
- Acoes inline com confirmacao para destrutivas (desativar)
- Status badges com cores semanticas (verde=ativo, vermelho=inativo, amarelo=pendente)

---

## 9. Fontes de pesquisa — Wave 4

### Autenticacao e Login
- [OWASP — Broken Access Control (A01:2021)](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [Evolution API — Documentacao](https://doc.evolution-api.com/)
- [Supabase — Auth Overview](https://supabase.com/docs/guides/auth)
- [Clerk — Passwordless Auth](https://clerk.com/blog)
- [Auth0 — OTP Best Practices](https://auth0.com/docs/authenticate)
- [Web OTP API — Chrome](https://developer.chrome.com/docs/identity/web-otp)
- [Nodemailer — SMTP Transport](https://nodemailer.com/smtp/)

### Avatar e Crop
- [react-easy-crop — GitHub](https://github.com/ValentinH/react-easy-crop)
- [browser-image-compression — npm](https://www.npmjs.com/package/browser-image-compression)
- [Supabase Storage — File Upload](https://supabase.com/docs/guides/storage/uploads)
- [HEIC to JPEG conversion — heic2any](https://github.com/nicolo-ribaudo/heic2any)

### Concorrentes
- [Loggi — App entregador](https://play.google.com/store/apps/details?id=com.loggi.courier)
- [iFood — Portal do restaurante](https://portal.ifood.com.br/)
- [99 — App motorista](https://play.google.com/store/apps/details?id=com.ninety9.driver)
- [Lalamove — Brasil](https://www.lalamove.com/pt-br/)
- [Rappi — Soy Rappitendero](https://play.google.com/store/apps/details?id=com.grability.rappidomicilios)
- [Entregas Expressas](https://entregasexpressas.com.br)
- [SyLog — GR Express](https://www.sylog.com.br/gr-exp-gestao-entregas-rapidas)

### Seguranca
- [OWASP Top 10 — 2021](https://owasp.org/Top10/)
- [Hono — Middleware](https://hono.dev/docs/guides/middleware)
- [JWT Best Practices — RFC 8725](https://datatracker.ietf.org/doc/html/rfc8725)
