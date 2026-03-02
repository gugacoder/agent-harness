# Chega.la - Requisitos Wave 4: Seguranca, Login, Perfil

Requisitos funcionais e nao-funcionais para RBAC granular, login OTP (WhatsApp/Email), perfil editavel, avatar com crop, gestao de usuarios e configuracao de canais.

---

## RBAC e Seguranca de Rotas

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD001 | O sistema deve verificar o papel (role) do usuario autenticado em cada endpoint protegido da API |
| OSD002 | O sistema deve rejeitar requisicoes de usuarios sem o papel necessario com HTTP 403 e mensagem "Voce nao tem permissao para esta acao" |
| OSD003 | O sistema deve implementar middleware `requireRole(...roles)` reutilizavel no Hono, aplicavel como guard antes de cada rota |
| OSD004 | O sistema deve registrar tentativas de acesso bloqueadas por RBAC em log estruturado (user_id, endpoint, role_atual, roles_requeridos, timestamp) |
| OSD005 | O sistema deve permitir que endpoints aceitem multiplos roles (ex: `requireRole('operator', 'super_admin')`) |
| OSD006 | O sistema deve impedir que usuarios com role `courier` acessem endpoints de criacao de pedidos, lojas, configuracoes ou financeiro |
| OSD007 | O sistema deve impedir que usuarios com role `shop` acessem endpoints de gestao administrativa (criar lojas, alterar config, gerenciar usuarios) |
| OSD008 | O sistema deve manter a matriz de permissoes atualizada como documentacao vinculante ao codigo |

---

## Super Admin

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD020 | O sistema deve suportar o papel `super_admin` no JWT via `app_metadata.role = 'super_admin'` |
| OSD021 | O sistema deve permitir que super_admin acesse dados de qualquer empresa, ignorando o filtro de company_id |
| OSD022 | O sistema deve expor endpoint GET /api/admin/companies para listar todas as empresas cadastradas |
| OSD023 | O sistema deve expor endpoint POST /api/admin/companies para criar novas empresas |
| OSD024 | O sistema deve expor endpoint PATCH /api/admin/companies/:id para ativar ou desativar empresas |
| OSD025 | O sistema deve exibir dashboard na Central com metricas globais: total de empresas, total de entregas, total de usuarios ativos |
| OSD026 | O sistema deve permitir que super_admin alterne o contexto de empresa (impersonar) para diagnosticar problemas |
| OSD027 | O sistema deve isolar a area de super admin na Central com navegacao e sidebar proprias |

---

## Login OTP WhatsApp

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD040 | O sistema deve permitir login via numero de telefone + codigo OTP de 6 digitos |
| OSD041 | O sistema deve enviar o codigo OTP via mensagem WhatsApp utilizando Evolution API |
| OSD042 | O sistema deve gerar codigos OTP aleatorios de 6 digitos, armazenando apenas o hash bcrypt com expiracao de 5 minutos |
| OSD043 | O sistema deve limitar o envio de codigos OTP a 3 por minuto por numero de telefone (rate limiting) |
| OSD044 | O sistema deve validar o codigo OTP recebido e emitir JWT valido via Supabase Admin API |
| OSD045 | O sistema deve exibir tela de input de telefone com mascara brasileira (+55), bandeira BR e teclado numerico (inputmode="numeric") |
| OSD046 | O sistema deve exibir tela de input OTP com 6 campos individuais, auto-focus progressivo e suporte a colar codigo do clipboard |
| OSD047 | O sistema deve exibir timer countdown circular de reenvio apos cada envio de codigo |
| OSD048 | O sistema deve exibir mensagens de erro contextuais: "Codigo invalido", "Codigo expirado — enviamos um novo", "Muitas tentativas — aguarde X segundos" |
| OSD049 | O sistema deve suportar auto-preenchimento de codigo via Web OTP API quando disponivel no browser |

---

## Login OTP Email

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD055 | O sistema deve permitir login via email + codigo OTP de 6 digitos enviado por SMTP |
| OSD056 | O sistema deve enviar email com template HTML contendo logo da empresa, codigo em destaque, prazo de expiracao e instrucoes |
| OSD057 | O sistema deve reutilizar o mesmo backend de validacao de codigo e emissao de JWT do OTP WhatsApp |
| OSD058 | O sistema deve oferecer OTP Email como alternativa quando o canal WhatsApp nao estiver configurado ou indisponivel |

---

## Edicao de Perfil

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD060 | O sistema deve exibir tela "Meu Perfil" acessivel em cada app (Central, Lojista, Motoboy) |
| OSD061 | O sistema deve permitir edicao do nome completo e telefone do usuario |
| OSD062 | O sistema deve permitir edicao do email com verificacao via OTP antes de efetivar a mudanca |
| OSD063 | O sistema deve pre-preencher o formulario de perfil com os dados atuais do usuario |
| OSD064 | O sistema deve validar unicidade do telefone dentro da mesma empresa |
| OSD065 | O sistema deve validar unicidade do email globalmente |
| OSD066 | O sistema deve expor endpoint PATCH /api/profiles/me para atualizacao dos dados do perfil |
| OSD067 | O sistema deve sincronizar alteracoes de nome e email com Supabase Auth user_metadata |
| OSD068 | O sistema deve exibir validacao em tempo real nos campos do formulario (nao apenas no submit) |
| OSD070 | O sistema deve permitir que o motoboy edite tipo de veiculo, placa e CNH na tela de perfil |
| OSD072 | O sistema deve permitir que o lojista edite nome da loja, endereco e horario de funcionamento na tela de perfil |

---

## Avatar

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD080 | O sistema deve exibir componente de avatar clicavel na tela de perfil e no header de cada app |
| OSD081 | O sistema deve permitir selecao de imagem via camera (mobile) ou galeria/arquivo (desktop) |
| OSD082 | O sistema deve aceitar formatos JPEG, PNG, WebP, HEIC, HEIF, BMP e TIFF |
| OSD083 | O sistema deve converter imagens automaticamente para WebP no frontend antes do upload |
| OSD084 | O sistema deve exibir area de crop circular interativa com zoom e pan (drag + scroll) |
| OSD085 | O sistema deve comprimir a imagem apos crop para maximo 500KB e redimensionar para 512x512 pixels |
| OSD086 | O sistema deve fazer upload do avatar para Supabase Storage no bucket `avatars` |
| OSD087 | O sistema deve salvar a URL publica do avatar no campo profiles.avatar_url |
| OSD088 | O sistema deve exibir fallback visual com iniciais do nome + cor de fundo deterministica quando o usuario nao tem avatar |
| OSD089 | O sistema deve suportar gestos touch (pinch-to-zoom e drag) em dispositivos mobile durante o crop |

---

## Gestao de Usuarios

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD100 | O sistema deve exibir tela de gestao de usuarios na Central com lista de todos os usuarios da empresa |
| OSD101 | O sistema deve permitir filtrar usuarios por papel (operator, shop, courier) |
| OSD102 | O sistema deve permitir filtrar usuarios por status (ativo, inativo) |
| OSD103 | O sistema deve permitir buscar usuarios por nome ou email com debounce de 300ms |
| OSD104 | O sistema deve exibir grid responsivo: cards em mobile, tabela em desktop |
| OSD105 | O sistema deve permitir editar dados de qualquer usuario da empresa (nome, telefone, email) |
| OSD106 | O sistema deve permitir desativar e reativar usuarios com dialog de confirmacao |
| OSD107 | O sistema deve permitir alterar o papel (role) de um usuario |
| OSD108 | O sistema deve permitir enviar email de reset de senha para um usuario |
| OSD109 | O sistema deve exibir avatar, nome completo, role badge, status badge e data da ultima atividade na lista de usuarios |
| OSD110 | O sistema deve permitir selecao multipla e acoes em massa (desativar multiplos usuarios) |

---

## Configuracao de Canais OTP

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD120 | O sistema deve exibir secao de configuracao de canais OTP na pagina de Configuracao da Central |
| OSD121 | O sistema deve permitir configurar instancia Evolution API com campos: URL, API Key e toggle ativar/desativar |
| OSD122 | O sistema deve permitir testar conexao WhatsApp enviando mensagem de teste para o numero do operador |
| OSD123 | O sistema deve permitir configurar SMTP com campos: host, porta, usuario, senha, email remetente e toggle ativar/desativar |
| OSD124 | O sistema deve detectar automaticamente suporte a TLS/SSL ao configurar SMTP |
| OSD125 | O sistema deve permitir enviar email de teste para o email do operador logado |
| OSD126 | O sistema deve armazenar credenciais de canais OTP criptografadas em repouso (encrypted at rest) |
| OSD127 | O sistema deve exibir badge de status de configuracao: verde "Configurado" ou vermelho "Nao configurado" para cada canal |
| OSD128 | O sistema deve expor endpoint PATCH /api/company/config para salvar configuracoes de canais OTP |
| OSD129 | O sistema deve expor endpoints POST /api/company/config/test-smtp e POST /api/company/config/test-whatsapp para testes de conectividade |

---

## Self-Registration

### RF - Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| OSD130 | O sistema deve permitir auto-cadastro de motoboys via app Motoboy sem necessidade de invite do operador |
| OSD131 | O sistema deve permitir auto-cadastro de lojistas via app Lojista sem necessidade de invite do operador |
| OSD132 | O sistema deve exigir aprovacao do operador para ativar a conta de um usuario auto-cadastrado |
| OSD133 | O sistema deve notificar o operador quando um novo cadastro aguarda aprovacao |

---

## RNF - Requisitos Nao Funcionais

| ID | Requisito |
|----|-----------|
| RNF001 | O sistema deve responder a requisicoes de envio e verificacao de OTP em menos de 2 segundos |
| RNF002 | O sistema deve armazenar codigos OTP exclusivamente como hash bcrypt, nunca em texto claro |
| RNF003 | O sistema deve limitar tentativas de verificacao OTP a 5 por codigo gerado (protecao contra brute force) |
| RNF004 | O sistema deve registrar todas as acoes bloqueadas por RBAC em log estruturado para auditoria |
| RNF005 | O sistema deve utilizar HTTPS/TLS para todas as comunicacoes com Evolution API e servidores SMTP |
| RNF006 | O sistema deve comprimir avatares no frontend antes do upload, garantindo maximo de 500KB por imagem |
| RNF007 | O sistema deve renderizar a lista de gestao de usuarios com ate 100 registros sem necessidade de paginacao server-side |
| RNF008 | O sistema deve executar a operacao de crop de avatar a 60fps em dispositivos mobile de gama media |

---

## Matriz de Permissoes

| Endpoint | operator | shop | courier | super_admin |
|----------|----------|------|---------|-------------|
| POST /api/orders | - | ✅ | - | ✅ |
| GET /api/orders | ✅ | ✅ (proprios) | ✅ (atribuidos) | ✅ |
| POST /api/shops | ✅ | - | - | ✅ |
| PATCH /api/company/config | ✅ | - | - | ✅ |
| POST /api/auth/invite | ✅ | - | - | ✅ |
| POST /api/deliveries/:id/accept | - | - | ✅ | ✅ |
| GET /api/analytics | ✅ | - | - | ✅ |
| GET /api/financial/* | ✅ | - | - | ✅ |
| GET /api/pricing/* | ✅ | - | - | ✅ |
| PATCH /api/profiles/me | ✅ | ✅ | ✅ | ✅ |
| GET /api/users | ✅ | - | - | ✅ |
| PATCH /api/users/:id | ✅ | - | - | ✅ |
| PATCH /api/users/:id/status | ✅ | - | - | ✅ |
| GET /api/admin/companies | - | - | - | ✅ |
| POST /api/admin/companies | - | - | - | ✅ |
| PATCH /api/admin/companies/:id | - | - | - | ✅ |
| POST /api/auth/otp/send | publico | publico | publico | publico |
| POST /api/auth/otp/verify | publico | publico | publico | publico |

---

## Rastreabilidade

| Modulo | Requisitos |
|--------|------------|
| RBAC e Seguranca | OSD001-OSD008 |
| Super Admin | OSD020-OSD027 |
| Login OTP WhatsApp | OSD040-OSD049 |
| Login OTP Email | OSD055-OSD058 |
| Edicao de Perfil | OSD060-OSD068, OSD070, OSD072 |
| Avatar | OSD080-OSD089 |
| Gestao de Usuarios | OSD100-OSD110 |
| Config Canais OTP | OSD120-OSD129 |
| Self-Registration | OSD130-OSD133 |
| Nao Funcionais | RNF001-RNF008 |
