# Pain/Gain Registry — Wave 6: Chega.la

> Tabela de dores e ganhos classificados — acumulado waves 1-6.
> Perfis: Empresario, Operador, Lojista, Motoboy, Super Admin.
> Wave 6 — foco em Onboarding, Documentacao, Help contextual.
> Cada item classificado de 1 (menos relevante) a 10 (mais relevante).

---

## Novas discoveries — Wave 6

| ID | Tipo | Perfil | Descricao | Score | Justificativa | Wave |
|---|---|---|---|---|---|---|
| D-044 | pain | operador | Central: zero onboarding. Operador faz login e ve dashboard vazio sem nenhuma indicacao do que fazer. Sem wizard, sem tour, sem checklist. Alta chance de abandono no primeiro dia. | 8 | Primeira impressao define retencao. Operador que nao entende = empresa que nao adota. | wave-6 |
| D-045 | pain | motoboy | Motoboy: zero onboarding. Faz login e nao sabe: o que e "online", como ativar GPS, o que acontece ao receber entrega, como funciona POD. Publico de baixa paciencia. | 8 | Motoboy perdido no app = motoboy perdido para concorrencia. Precisa entender em < 2 min. | wave-6 |
| D-046 | pain | lojista | Lojista: zero onboarding. Primeiro pedido e confuso: campos sem contexto, sem indicacao de custo, sem explicacao do fluxo pos-pedido. | 7 | Lojista confuso cria pedidos errados ou desiste. Mais paciente que motoboy mas ainda precisa de guia. | wave-6 |
| D-047 | pain | todos | Sem documentacao de uso. Zero guias, zero FAQ, zero troubleshooting. Usuario com duvida nao tem onde buscar resposta. Suporte humano para duvidas basicas = custo alto. | 8 | Self-service e expectativa minima em 2026. Reduz custo de suporte. | wave-6 |
| D-048 | pain | todos | Sem help contextual. Nenhum tooltip, hint ou link de ajuda nas interfaces. Campos sem descricao. Configuracoes sem explicacao de impacto. | 6 | Aumenta curva de aprendizado. Usuarios novos precisam, avancados nao. | wave-6 |
| G-037 | gain | operador | Onboarding Central: wizard de configuracao inicial em 5 etapas. Boas-vindas → dados empresa → pricing template → convite equipe → pronto. Progresso salvo. Reacessavel. | 8 | Resolve D-044. Configuracao em 5 min. Primeira impressao positiva. | wave-6 |
| G-038 | gain | motoboy | Onboarding Motoboy: tutorial de 5 telas no primeiro login. GPS permission → como funciona → status online/offline → pronto. < 1 min. Skip disponivel. | 8 | Resolve D-045. Motoboy pronto para primeira entrega em 1 min. | wave-6 |
| G-039 | gain | lojista | Onboarding Lojista: overlay guiado no primeiro pedido. Highlights nos campos + explicacao do fluxo pos-pedido. Timeline visual. | 7 | Resolve D-046. Primeiro pedido com confianca. | wave-6 |
| G-040 | gain | todos | Guias de uso completos. docs/guides/central.md, motoboy.md, lojista.md. FAQ por papel. Troubleshooting. Linguagem simples, estrutura escaneavel. | 8 | Resolve D-047. Self-service 24/7. Base de conhecimento. | wave-6 |
| G-041 | gain | todos | Help contextual e tooltips. Icone "?" em campos criticos. Empty states educativos. Links para guias. Nao intrusivo. | 6 | Resolve D-048. Aprendizado no momento certo. | wave-6 |

---

## Tabela acumulada — Itens NAO implementados por score (wave 6)

### Score 9 (6 itens)

| ID | Tipo | Perfil | Descricao | Wave |
|---|---|---|---|---|
| D-027 | pain | empresario | Rotas API sem role-check. | wave-4 |
| D-030 | pain | motoboy | Login apenas email+senha. | wave-4 |
| D-035 | pain | lojista | Endereco 100% manual. | wave-5 |
| G-022 | gain | empresario | RBAC granular. | wave-4 |
| G-025 | gain | motoboy | Login OTP WhatsApp. | wave-4 |
| G-030 | gain | lojista | Autocomplete enderecos. | wave-5 |

### Score 8 (25 itens)

| ID | Tipo | Perfil | Descricao | Wave |
|---|---|---|---|---|
| D-019 | pain | empresario | Periculosidade 30%. | wave-2 |
| D-028 | pain | empresario | Sem super admin. | wave-4 |
| D-029 | pain | empresario | Sem gestao times. | wave-4 |
| D-032 | pain | todos | Sem edicao perfil. | wave-4 |
| D-036 | pain | lojista | Sem enderecos salvos. | wave-5 |
| D-037 | pain | lojista | Sem geocoding. | wave-5 |
| D-040 | pain | operador | CRUD lojas incompleto. | wave-5 |
| D-041 | pain | operador | CRUD motoboys incompleto. | wave-5 |
| D-042 | pain | operador | Motoboy nao aparece mapa. | wave-5 |
| D-043 | pain | todos | Interfaces incompletas. | wave-5 |
| D-044 | pain | operador | Central sem onboarding. | wave-6 |
| D-045 | pain | motoboy | Motoboy sem onboarding. | wave-6 |
| D-047 | pain | todos | Sem documentacao. | wave-6 |
| G-023 | gain | super_admin | Super admin. | wave-4 |
| G-024 | gain | empresario | Gestao usuarios. | wave-4 |
| G-027 | gain | todos | Edicao perfil. | wave-4 |
| G-031 | gain | lojista | Enderecos salvos. | wave-5 |
| G-033 | gain | operador | CRUD lojas. | wave-5 |
| G-034 | gain | operador | CRUD motoboys. | wave-5 |
| G-035 | gain | operador | Fix tracking. | wave-5 |
| G-036 | gain | todos | Quality pass. | wave-5 |
| G-037 | gain | operador | Wizard central. | wave-6 |
| G-038 | gain | motoboy | Tutorial motoboy. | wave-6 |
| G-040 | gain | todos | Guias de uso. | wave-6 |

### Score 7 (14 itens)

| ID | Tipo | Perfil | Descricao | Wave |
|---|---|---|---|---|
| D-005 | pain | empresario | Rotas mal planejadas. | wave-1 |
| D-020 | pain | empresario | Rotatividade motoboys. | wave-2 |
| D-021 | pain | lojista | Sem ETA. | wave-2 |
| D-024 | pain | empresario | Dispatch manual. | wave-3 |
| D-031 | pain | empresario | Sem self-registration. | wave-4 |
| D-033 | pain | motoboy | Sem avatar. | wave-4 |
| D-034 | pain | empresario | Sem config OTP. | wave-4 |
| D-038 | pain | lojista | Sem gestao enderecos. | wave-5 |
| D-039 | pain | lojista | Sem pin drop. | wave-5 |
| D-046 | pain | lojista | Lojista sem onboarding. | wave-6 |
| G-015 | gain | empresario | Dispatch inteligente. | wave-2 |
| G-016 | gain | lojista | Link rastreamento. | wave-2 |
| G-018 | gain | lojista | ETA basico. | wave-3 |
| G-019 | gain | lojista | Pagina publica rastreamento. | wave-3 |
| G-026 | gain | lojista | OTP Email. | wave-4 |
| G-028 | gain | todos | Avatar crop. | wave-4 |
| G-029 | gain | empresario | Config OTP. | wave-4 |
| G-032 | gain | lojista | Gestao enderecos. | wave-5 |
| G-039 | gain | lojista | Onboarding lojista. | wave-6 |

### Score 6 ou menos (8 itens)

| ID | Score | Tipo | Perfil | Descricao | Wave |
|---|---|---|---|---|---|
| D-022 | 6 | pain | lojista | Sem notif cliente final. | wave-2 |
| D-025 | 6 | pain | lojista | Sem notif fora app. | wave-3 |
| D-026 | 6 | pain | empresario | Sem simulador regulatorio. | wave-3 |
| D-048 | 6 | pain | todos | Sem help contextual. | wave-6 |
| G-005 | 6 | gain | empresario | IA progressiva. | wave-1 |
| G-021 | 6 | gain | empresario | Webhook/WhatsApp. | wave-3 |
| G-041 | 6 | gain | todos | Help contextual. | wave-6 |
| G-020 | 5 | gain | motoboy | Ranking entregadores. | wave-3 |
| D-016 | 4 | pain | motoboy | Sem roteirizacao. | wave-1 |
| D-009 | 3 | pain | empresario | Resiliencia operacional. | wave-1 |

---

## Resumo estatistico — Wave 6 acumulado

| Metrica | Wave 5 | Wave 6 (acumulado) |
|---|---|---|
| Total discoveries | 76 | 86 |
| Dores (pain) | 43 | 48 |
| Ganhos (gain) | 33 | 38 |
| Score medio | 7.3 | 7.3 |
| Items score >= 8 | 48 | 54 |
| Items score >= 9 | 20 | 20 |
| Implementados | 29 | 29 |
| Nao implementados | 45 | 55 |
| Parciais | 2 | 2 |
| Novas discoveries wave-6 | — | 10 |

### Wave 6 — score distribution (novas discoveries)

| Score | Qtd | Items |
|---|---|---|
| 8 | 6 | D-044, D-045, D-047, G-037, G-038, G-040 |
| 7 | 2 | D-046, G-039 |
| 6 | 2 | D-048, G-041 |

**Media novas discoveries wave-6**: 7.4

---

## Cobertura por perfil (wave 6)

| Perfil | Dores wave-6 | Ganhos wave-6 | Total |
|---|---|---|---|
| Operador | D-044 | G-037 | 2 |
| Motoboy | D-045 | G-038 | 2 |
| Lojista | D-046 | G-039 | 2 |
| Todos | D-047, D-048 | G-040, G-041 | 4 |

---

## Visao consolidada — Waves 4-5-6

| Wave | Tema | Discoveries | Score medio | Items 8+ | Items 9+ |
|---|---|---|---|---|---|
| Wave 4 | Seguranca, Login, Perfil | 16 | 8.0 | 11 | 4 |
| Wave 5 | Enderecos, Completude | 16 | 8.0 | 14 | 2 |
| Wave 6 | Onboarding, Docs | 10 | 7.4 | 6 | 0 |
| **Total** | | **42** | **7.9** | **31** | **6** |

### Dependencias entre waves

```
Wave 4 (Seguranca + Login + Perfil)
  └──→ Wave 5 (Enderecos + Completude)
         └──→ Wave 6 (Onboarding + Docs)
```

Wave 5 depende de Wave 4:
- Autocomplete de enderecos usa Leaflet + formularios ja polidos (wave-4 perfil)
- CRUD completo de lojas/motoboys se beneficia de gestao de usuarios (wave-4)

Wave 6 depende de Wave 5:
- Onboarding deve guiar pelo produto COMPLETO, nao por um produto incompleto
- Guias de uso devem documentar funcionalidades finais
- Empty states educativos referenciam features que devem existir
