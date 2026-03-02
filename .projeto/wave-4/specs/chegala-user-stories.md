# Chega.la - User Stories Wave 4: Seguranca, Login, Perfil

Historias de usuario para RBAC, login OTP, perfil editavel, avatar, gestao de usuarios e configuracao de canais.

---

## Motoboy

### US001 - Login via OTP WhatsApp

**Como** motoboy
**Quero** fazer login digitando meu telefone e recebendo um codigo no WhatsApp
**Para** entrar no app sem precisar lembrar email ou senha

**Criterios de Aceite:**
- [ ] Tela exibe campo de telefone com mascara brasileira (+55) e teclado numerico
- [ ] Ao enviar, recebo codigo de 6 digitos no WhatsApp em ate 10 segundos
- [ ] Tela de codigo com 6 campos, auto-focus progressivo
- [ ] Codigo colado do clipboard preenche todos os campos automaticamente
- [ ] Apos validacao, sou redirecionado para a home do app Motoboy
- [ ] Se codigo invalido, mensagem de erro inline
- [ ] Se codigo expirado, opcao "Enviar novamente" com timer countdown
- [ ] Maximo 3 envios por minuto exibindo feedback ao atingir limite

**Requisitos:** OSD040-OSD049

### US002 - Editar meu perfil

**Como** motoboy
**Quero** editar meu nome, telefone, tipo de veiculo, placa e CNH
**Para** manter meus dados atualizados sem depender do operador

**Criterios de Aceite:**
- [ ] Tela "Meu Perfil" acessivel pelo menu/header do app
- [ ] Formulario pre-preenchido com dados atuais
- [ ] Campos: nome completo, telefone, tipo de veiculo, placa, CNH
- [ ] Validacao em tempo real nos campos
- [ ] Toast de confirmacao ao salvar com sucesso
- [ ] Erro inline se telefone ja cadastrado na empresa

**Requisitos:** OSD060-OSD068, OSD070

### US003 - Upload e crop de avatar

**Como** motoboy
**Quero** tirar ou selecionar uma foto e recortar em formato circular
**Para** que lojistas vejam meu rosto durante as entregas

**Criterios de Aceite:**
- [ ] Clicar no avatar (ou placeholder) abre opcoes: camera ou galeria
- [ ] Area de crop circular com zoom (pinch em mobile, scroll em desktop)
- [ ] Preview circular em tempo real durante crop
- [ ] Imagem comprimida automaticamente se necessario (max 500KB)
- [ ] Avatar atualizado em toda a interface apos upload
- [ ] Fallback com iniciais + cor unica quando sem foto

**Requisitos:** OSD080-OSD089

### US005 - Auto-cadastro como motoboy

**Como** motoboy novo
**Quero** me cadastrar diretamente pelo app sem esperar convite do operador
**Para** comecar a trabalhar o mais rapido possivel

**Criterios de Aceite:**
- [ ] Tela de cadastro acessivel na tela de login ("Criar conta")
- [ ] Formulario: nome, telefone, tipo de veiculo
- [ ] Apos envio, mensagem "Cadastro enviado — aguardando aprovacao"
- [ ] Operador recebe notificacao de novo cadastro pendente
- [ ] Apos aprovacao do operador, usuario pode fazer login

**Requisitos:** OSD130-OSD133

---

## Lojista

### US020 - Login via OTP WhatsApp

**Como** lojista
**Quero** fazer login via telefone + codigo WhatsApp
**Para** acessar o app rapidamente sem senha

**Criterios de Aceite:**
- [ ] Mesmo fluxo do motoboy (US001) aplicado ao app Lojista
- [ ] Apos login, redirecionado para home do Lojista

**Requisitos:** OSD040-OSD049

### US021 - Login via OTP Email

**Como** lojista
**Quero** fazer login via email + codigo OTP por email
**Para** ter uma alternativa quando nao uso WhatsApp comercial

**Criterios de Aceite:**
- [ ] Opcao "Entrar com email" visivel na tela de login
- [ ] Recebo email com codigo de 6 digitos, logo da empresa e prazo de expiracao
- [ ] Mesmo fluxo de verificacao de codigo do WhatsApp
- [ ] Email chega em ate 30 segundos

**Requisitos:** OSD055-OSD058

### US022 - Editar perfil da loja

**Como** lojista
**Quero** editar nome da loja, endereco e horario de funcionamento
**Para** manter informacoes da loja atualizadas

**Criterios de Aceite:**
- [ ] Tela "Meu Perfil" com campos pessoais (nome, telefone) + campos da loja
- [ ] Formulario pre-preenchido com dados atuais
- [ ] Validacao em tempo real
- [ ] Toast de confirmacao ao salvar

**Requisitos:** OSD060-OSD068, OSD072

### US023 - Upload e crop de avatar

**Como** lojista
**Quero** adicionar minha foto de perfil
**Para** ser identificado visualmente na plataforma

**Criterios de Aceite:**
- [ ] Mesma funcionalidade de crop do motoboy (US003)

**Requisitos:** OSD080-OSD089

### US025 - Auto-cadastro como lojista

**Como** lojista novo
**Quero** me cadastrar pelo app sem esperar convite
**Para** comecar a usar a plataforma rapidamente

**Criterios de Aceite:**
- [ ] Tela de cadastro com campos: nome, email, telefone, nome da loja
- [ ] Mensagem "Cadastro enviado — aguardando aprovacao" apos envio
- [ ] Operador notificado de cadastro pendente

**Requisitos:** OSD130-OSD133

---

## Operador

### US040 - Listar e buscar usuarios da empresa

**Como** operador
**Quero** ver todos os usuarios da empresa com filtros e busca
**Para** encontrar rapidamente quem preciso gerenciar

**Criterios de Aceite:**
- [ ] Tela de gestao com lista de usuarios
- [ ] Filtro por papel (operator, shop, courier)
- [ ] Filtro por status (ativo, inativo)
- [ ] Busca por nome ou email com debounce 300ms
- [ ] Grid responsivo: tabela em desktop, cards em mobile
- [ ] Cada item mostra: avatar, nome, role badge, status badge, ultima atividade

**Requisitos:** OSD100-OSD104, OSD109

### US041 - Editar dados de usuario

**Como** operador
**Quero** editar nome, telefone e email de qualquer usuario da empresa
**Para** corrigir dados sem acessar o banco de dados

**Criterios de Aceite:**
- [ ] Botao "Editar" visivel na lista de usuarios
- [ ] Dialog ou pagina com formulario pre-preenchido
- [ ] Validacao de unicidade de telefone e email
- [ ] Toast de confirmacao ao salvar

**Requisitos:** OSD105

### US042 - Desativar e reativar usuario

**Como** operador
**Quero** desativar um usuario que saiu e reativar se voltar
**Para** controlar acesso sem deletar dados

**Criterios de Aceite:**
- [ ] Botao "Desativar" com dialog de confirmacao
- [ ] Usuario desativado aparece com badge vermelho "Inativo"
- [ ] Botao "Reativar" disponivel para inativos
- [ ] Desativacao impede login do usuario

**Requisitos:** OSD106

### US043 - Alterar papel de usuario

**Como** operador
**Quero** mudar o papel de um usuario (ex: promover shop a operator)
**Para** ajustar permissoes conforme necessidade

**Criterios de Aceite:**
- [ ] Dropdown de role na edicao de usuario
- [ ] Confirmacao antes de alterar
- [ ] Alteracao refletida no JWT no proximo login

**Requisitos:** OSD107

### US044 - Resetar senha de usuario

**Como** operador
**Quero** enviar email de reset de senha para um usuario
**Para** desbloquear acesso quando o usuario esquece a senha

**Criterios de Aceite:**
- [ ] Botao "Resetar senha" na edicao de usuario
- [ ] Email de reset enviado via Supabase Auth
- [ ] Toast de confirmacao ao operador

**Requisitos:** OSD108

### US045 - Configurar canal WhatsApp

**Como** operador
**Quero** configurar a instancia do Evolution API (URL + API Key)
**Para** que meus usuarios possam fazer login via OTP WhatsApp

**Criterios de Aceite:**
- [ ] Secao "WhatsApp" na pagina de configuracao
- [ ] Campos: URL da instancia, API Key, toggle ativar/desativar
- [ ] Botao "Testar conexao" envia mensagem de teste para meu numero
- [ ] Badge verde "Configurado" / vermelho "Nao configurado"

**Requisitos:** OSD120-OSD122, OSD127

### US046 - Configurar canal SMTP

**Como** operador
**Quero** configurar o servidor SMTP para envio de OTP por email
**Para** oferecer login via email aos usuarios

**Criterios de Aceite:**
- [ ] Secao "Email (SMTP)" na pagina de configuracao
- [ ] Campos: host, porta, usuario, senha, remetente, toggle ativar/desativar
- [ ] Botao "Detectar TLS" testa conexao automaticamente
- [ ] Botao "Enviar email de teste" envia para meu email
- [ ] Senha nunca exibida apos salvar (campo mascarado)

**Requisitos:** OSD123-OSD127

### US047 - Testar conexao dos canais

**Como** operador
**Quero** testar se WhatsApp e SMTP estao funcionando
**Para** ter certeza que OTP vai funcionar antes de habilitar

**Criterios de Aceite:**
- [ ] Feedback verde "Conexao OK" ou vermelho "Falha: {motivo}"
- [ ] Teste demora menos de 10 segundos
- [ ] Mensagem/email de teste realmente chega no destino

**Requisitos:** OSD122, OSD125, OSD129

### US048 - Editar meu perfil (operador)

**Como** operador
**Quero** editar meu nome, telefone e email
**Para** manter meus dados atualizados

**Criterios de Aceite:**
- [ ] Tela "Meu Perfil" acessivel pelo menu
- [ ] Formulario pre-preenchido, validacao em tempo real

**Requisitos:** OSD060-OSD068

### US049 - Upload de avatar (operador)

**Como** operador
**Quero** adicionar minha foto de perfil
**Para** ser identificado na plataforma

**Criterios de Aceite:**
- [ ] Mesma funcionalidade de crop (US003)

**Requisitos:** OSD080-OSD089

### US050 - Aprovar cadastros pendentes

**Como** operador
**Quero** ver e aprovar/rejeitar cadastros de novos motoboys e lojistas
**Para** controlar quem entra na minha empresa

**Criterios de Aceite:**
- [ ] Notificacao visual na Central quando ha cadastros pendentes
- [ ] Lista de cadastros pendentes com dados do solicitante
- [ ] Botoes "Aprovar" e "Rejeitar" com confirmacao
- [ ] Apos aprovacao, usuario pode fazer login

**Requisitos:** OSD132, OSD133

---

## Super Admin

### US070 - Listar todas as empresas

**Como** super admin
**Quero** ver a lista de todas as empresas cadastradas na plataforma
**Para** ter visao global da operacao

**Criterios de Aceite:**
- [ ] Tela com lista de empresas: nome, CNPJ, status, total usuarios, total entregas
- [ ] Filtro por status (ativa, suspensa)
- [ ] Busca por nome ou CNPJ

**Requisitos:** OSD022, OSD025

### US071 - Criar nova empresa

**Como** super admin
**Quero** cadastrar uma nova empresa na plataforma
**Para** expandir a base de clientes

**Criterios de Aceite:**
- [ ] Formulario: nome, CNPJ, telefone, email, endereco
- [ ] Validacao de CNPJ unico
- [ ] Empresa criada com status "active" por padrao

**Requisitos:** OSD023

### US072 - Ativar/desativar empresa

**Como** super admin
**Quero** suspender ou reativar uma empresa
**Para** controlar acesso a plataforma

**Criterios de Aceite:**
- [ ] Botao "Suspender" com dialog de confirmacao
- [ ] Empresa suspensa: todos os usuarios impedidos de logar
- [ ] Botao "Reativar" disponivel para empresas suspensas

**Requisitos:** OSD024

### US073 - Impersonar empresa

**Como** super admin
**Quero** alternar meu contexto para uma empresa especifica
**Para** diagnosticar problemas como se fosse um operador daquela empresa

**Criterios de Aceite:**
- [ ] Botao "Entrar como" na lista de empresas
- [ ] Interface muda para exibir dados da empresa selecionada
- [ ] Badge visivel indicando "Impersonando: {nome empresa}"
- [ ] Botao "Voltar para admin" para sair do modo impersonacao

**Requisitos:** OSD026

### US074 - Ver metricas globais

**Como** super admin
**Quero** ver dashboard com metricas de todas as empresas
**Para** monitorar a saude da plataforma

**Criterios de Aceite:**
- [ ] Cards: total empresas ativas, total entregas (hoje/semana/mes), total usuarios ativos
- [ ] Grafico de entregas por dia (ultimos 30 dias)

**Requisitos:** OSD025

---

## Rastreabilidade

| User Story | Requisitos OSD |
|------------|----------------|
| US001 | OSD040-OSD049 |
| US002 | OSD060-OSD068, OSD070 |
| US003 | OSD080-OSD089 |
| US005 | OSD130-OSD133 |
| US020 | OSD040-OSD049 |
| US021 | OSD055-OSD058 |
| US022 | OSD060-OSD068, OSD072 |
| US023 | OSD080-OSD089 |
| US025 | OSD130-OSD133 |
| US040 | OSD100-OSD104, OSD109 |
| US041 | OSD105 |
| US042 | OSD106 |
| US043 | OSD107 |
| US044 | OSD108 |
| US045 | OSD120-OSD122, OSD127 |
| US046 | OSD123-OSD127 |
| US047 | OSD122, OSD125, OSD129 |
| US048 | OSD060-OSD068 |
| US049 | OSD080-OSD089 |
| US050 | OSD132, OSD133 |
| US070 | OSD022, OSD025 |
| US071 | OSD023 |
| US072 | OSD024 |
| US073 | OSD026 |
| US074 | OSD025 |
