# Pain/Gain Registry — Wave 4: Chega.la

> Tabela de dores e ganhos classificados — acumulado waves 1-4.
> Perfis: Empresario, Operador, Lojista, Motoboy, Super Admin.
> Wave 4 — foco em Seguranca, Login, Perfil, Gestao de Times.
> Cada item classificado de 1 (menos relevante) a 10 (mais relevante).

---

## Novas discoveries — Wave 4

| ID | Tipo | Perfil | Descricao | Score | Justificativa | Wave |
|---|---|---|---|---|---|---|
| D-027 | pain | empresario | Rotas API sem verificacao de papel (role-check). authMiddleware valida JWT mas nenhum endpoint verifica role. Motoboy pode criar pedidos, alterar config, fechar financeiro via curl. OWASP A01. | 9 | Vulnerabilidade critica. Qualquer usuario autenticado pode executar qualquer operacao. | wave-4 |
| D-028 | pain | empresario | Sem super admin / acesso cross-company. Nao existe papel de administrador da plataforma. Diagnostico e gestao requerem acesso direto ao banco. | 8 | Necessario para operar plataforma multi-tenant. Todos SaaS concorrentes tem. | wave-4 |
| D-029 | pain | empresario | Sem gestao de times e usuarios. Operador nao pode editar, desativar, mudar papel, resetar senha. Lista basica sem acoes de gestao real. | 8 | Empresa nao consegue gerir seu proprio time pelo app. Requer banco direto. | wave-4 |
| D-030 | pain | motoboy | Login apenas email + senha. Unico metodo de login. Motoboys nao usam email regularmente. Atrito maximo vs concorrentes que usam telefone + OTP. | 9 | Atrito de login = abandono. Todos os concorrentes usam OTP. | wave-4 |
| D-031 | pain | empresario | Sem self-registration. Motoboys e lojistas dependem 100% de invite do operador por email. Fluxo longo e fragil. Concorrentes permitem auto-cadastro. | 7 | Gargalo operacional. Nao bloqueante mas causa atrito. | wave-4 |
| D-032 | pain | todos | Sem edicao de perfil. Usuario nao pode alterar nome, telefone, email. Nao existe rota PATCH /profiles/me nem tela de edicao. Zero autonomia. | 8 | Funcionalidade basica ausente. Todos os apps modernos permitem editar perfil. | wave-4 |
| D-033 | pain | motoboy | Sem avatar. Campo avatar_url existe mas sem upload, crop ou UI. Usuarios aparecem como circulos cinza. Sem identidade visual. | 7 | UX e confianca. Lojista quer ver quem entrega. Concorrentes todos tem foto com crop. | wave-4 |
| D-034 | pain | empresario | Sem configuracao de canais OTP. Nao existe area para configurar Evolution API (WhatsApp) nem SMTP (email). Multi-tenant precisa de config por empresa. | 7 | Infraestrutura necessaria para OTP funcionar em producao. | wave-4 |
| G-022 | gain | empresario | RBAC granular com middleware requireRole(). Verificacao de papel em cada endpoint. Matriz de permissoes documentada. Testes automatizados. | 9 | Resolve D-027. Seguranca fundamental. | wave-4 |
| G-023 | gain | super_admin | Super admin cross-company. Role super_admin no JWT. Bypass de company filter. Dashboard de gestao da plataforma. | 8 | Resolve D-028. Necessario para operar a plataforma. | wave-4 |
| G-024 | gain | empresario | Gestao completa de usuarios e times. CRUD na Central: listar, editar, desativar, mudar papel, resetar senha. Grid com avatar, badges, filtros. | 8 | Resolve D-029. Autonomia operacional. | wave-4 |
| G-025 | gain | motoboy | Login via OTP WhatsApp (Evolution API). Telefone + codigo de 6 digitos. Sem senha. Rate limit. Timer de reenvio. | 9 | Resolve D-030. Elimina atrito de login. Diferencial vs Entregas Expressas. | wave-4 |
| G-026 | gain | lojista | Login via OTP Email (SMTP). Codigo por email. Autodetect TLS/SSL. Email de teste. Template com logo da empresa. | 7 | Alternativa ao WhatsApp para operadores e lojistas corporativos. | wave-4 |
| G-027 | gain | todos | Edicao completa de perfil. Tela "Meu Perfil" em cada app. PATCH /api/profiles/me. Validacao em tempo real. | 8 | Resolve D-032. Autonomia basica do usuario. | wave-4 |
| G-028 | gain | todos | Avatar com upload e crop rico. Camera + galeria. Crop circular interativo (react-easy-crop). Multi-formato (JPEG, PNG, WebP, HEIC). Compressao automatica. Supabase Storage. | 7 | Resolve D-033. Identidade visual e confianca. | wave-4 |
| G-029 | gain | empresario | Configuracao de canais OTP no admin. WhatsApp: URL + API key + teste conexao. SMTP: host + porta + usuario + autodetect TLS + email de teste. | 7 | Resolve D-034. Infraestrutura para OTP multi-tenant. | wave-4 |

---

## Reclassificacoes wave-4

Nenhum item de waves anteriores foi reclassificado na wave-4. Esta wave introduz um dominio novo (acesso e identidade) sem alterar scores existentes.

---

## Tabela acumulada — Itens NAO implementados (ordenado por score)

| Score | ID | Tipo | Perfil | Descricao | Wave |
|---|---|---|---|---|---|
| 9 | D-027 | pain | empresario | Rotas API sem role-check. Vulnerabilidade OWASP A01. | wave-4 |
| 9 | D-030 | pain | motoboy | Login apenas email+senha. Atrito maximo. | wave-4 |
| 9 | G-022 | gain | empresario | RBAC granular com middleware. | wave-4 |
| 9 | G-025 | gain | motoboy | Login OTP WhatsApp (Evolution). | wave-4 |
| 8 | D-019 | pain | empresario | Periculosidade 30% abril 2026. Compliance. | wave-2 |
| 8 | D-028 | pain | empresario | Sem super admin cross-company. | wave-4 |
| 8 | D-029 | pain | empresario | Sem gestao de times/usuarios. | wave-4 |
| 8 | D-032 | pain | todos | Sem edicao de perfil. | wave-4 |
| 8 | G-023 | gain | super_admin | Super admin cross-company. | wave-4 |
| 8 | G-024 | gain | empresario | Gestao completa de usuarios. | wave-4 |
| 8 | G-027 | gain | todos | Edicao completa de perfil. | wave-4 |
| 7 | D-005 | pain | empresario | Rotas mal planejadas (dispatch duplo). | wave-1 |
| 7 | D-020 | pain | empresario | Alta rotatividade motoboys. | wave-2 |
| 7 | D-021 | pain | lojista | Sem ETA para lojista. | wave-2 |
| 7 | D-024 | pain | empresario | Dispatch manual gargalo em escala. | wave-3 |
| 7 | D-031 | pain | empresario | Sem self-registration. | wave-4 |
| 7 | D-033 | pain | motoboy | Sem avatar. | wave-4 |
| 7 | D-034 | pain | empresario | Sem config canais OTP. | wave-4 |
| 7 | G-015 | gain | empresario | Dispatch inteligente. | wave-2 |
| 7 | G-016 | gain | lojista | Link rastreamento cliente final. | wave-2 |
| 7 | G-018 | gain | lojista | ETA basico automatico. | wave-3 |
| 7 | G-019 | gain | lojista | Pagina publica rastreamento. | wave-3 |
| 7 | G-026 | gain | lojista | Login OTP Email (SMTP). | wave-4 |
| 7 | G-028 | gain | todos | Avatar com crop rico. | wave-4 |
| 7 | G-029 | gain | empresario | Config canais OTP admin. | wave-4 |
| 6 | D-022 | pain | lojista | Sem notificacao cliente final. | wave-2 |
| 6 | D-025 | pain | lojista | Sem notificacoes fora do app. | wave-3 |
| 6 | D-026 | pain | empresario | Sem simulador regulatorio. | wave-3 |
| 6 | G-005 | gain | empresario | IA progressiva. | wave-1 |
| 6 | G-021 | gain | empresario | Webhook/WhatsApp notificacoes. | wave-3 |
| 5 | G-020 | gain | motoboy | Ranking entregadores. | wave-3 |
| 4 | D-016 | pain | motoboy | Sem roteirizacao. | wave-1 |
| 3 | D-009 | pain | empresario | Resiliencia operacional. | wave-1 |

---

## Resumo estatistico — Wave 4 acumulado

| Metrica | Wave 3 | Wave 4 (acumulado) |
|---|---|---|
| Total discoveries | 44 | 60 |
| Dores (pain) | 26 | 34 |
| Ganhos (gain) | 18 | 26 |
| Score medio | 7.2 | 7.3 |
| Items score >= 8 | 22 | 33 |
| Items score >= 9 | 10 | 14 |
| Implementados | 29 | 29 |
| Nao implementados | 13 | 29 |
| Parciais | 2 | 2 |
| Novas discoveries wave-4 | — | 16 |

### Wave 4 — score distribution (novas discoveries)

| Score | Qtd | Items |
|---|---|---|
| 9 | 4 | D-027, D-030, G-022, G-025 |
| 8 | 7 | D-028, D-029, D-032, G-023, G-024, G-027 |
| 7 | 5 | D-031, D-033, D-034, G-026, G-028, G-029 |

**Media novas discoveries wave-4**: 8.0 (vs 7.6 wave-1, 7.2 wave-2, 6.3 wave-3)

**Nota**: O score medio subiu porque esta wave expoe um dominio fundamental (seguranca, identidade) que foi negligenciado nas waves operacionais. Nao e feature creep — e divida tecnica de seguranca.

---

## Cobertura por perfil

| Perfil | Dores wave-4 | Ganhos wave-4 | Total |
|---|---|---|---|
| Empresario | D-027, D-028, D-029, D-031, D-034 | G-022, G-023, G-024, G-029 | 9 |
| Motoboy | D-030, D-033 | G-025, G-028 | 4 |
| Lojista | — | G-026, G-028 | 2 |
| Todos | D-032 | G-027, G-028 | 3 |
| Super admin | — | G-023 | 1 |
