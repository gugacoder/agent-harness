# Pain/Gain Registry — Wave 5: Chega.la

> Tabela de dores e ganhos classificados — acumulado waves 1-5.
> Perfis: Empresario, Operador, Lojista, Motoboy, Super Admin.
> Wave 5 — foco em Enderecos Inteligentes, Completude de Interfaces, Usabilidade Real.
> Cada item classificado de 1 (menos relevante) a 10 (mais relevante).

---

## Novas discoveries — Wave 5

| ID | Tipo | Perfil | Descricao | Score | Justificativa | Wave |
|---|---|---|---|---|---|---|
| D-035 | pain | lojista | Endereco 100% manual. Sem autocomplete, sem preenchimento por CEP, sem sugestao. Lojista digita rua, numero, bairro, cidade, CEP a cada pedido. ~2min/endereco x 30 pedidos = 1h/dia perdida. | 9 | Atrito operacional critico. Unico app do mercado sem autocomplete. | wave-5 |
| D-036 | pain | lojista | Sem enderecos salvos. Lojistas entregam para mesmos destinos repetidamente. Hoje digitam tudo de novo a cada vez. Sem recentes, sem favoritos. | 8 | Repeticao desnecessaria. iFood, Rappi, Lalamove todos salvam enderecos. | wave-5 |
| D-037 | pain | lojista | Sem geocoding. Pedidos criados com lat=0, lng=0. Mapa mostra entregas na Africa. Motoboy recebe texto sem coordenadas reais. Tracking de entrega inutilizado. | 8 | Mapa de entregas inutilizado. Coordenadas invalidas invalidam todo o tracking. | wave-5 |
| D-038 | pain | lojista | Sem gestao de enderecos. Nao existe entidade "endereco". Sem pre-cadastro, sem lista de locais frequentes, sem organizacao. | 7 | Conveniencia que vira necessidade em uso intenso (30+ pedidos/dia). | wave-5 |
| D-039 | pain | lojista | Sem pin drop. Enderecos imprecisos ("ao lado do mercado") nao podem ser indicados no mapa. Sem marcador arrastavel. | 7 | Essencial para areas com enderecamento precario. Comum no Brasil. | wave-5 |
| D-040 | pain | operador | CRUD de lojas incompleto. Apenas criar + listar. Sem editar dados, ver detalhes/historico, desativar. Corrigir endereco de loja requer banco direto. | 8 | Gestao de lojas e operacao diaria. Sem CRUD, nao e gestao. | wave-5 |
| D-041 | pain | operador | CRUD de motoboys incompleto. Apenas criar + listar + status. Sem editar dados, ver performance detalhada, metricas individuais, documentos. | 8 | Gestao de frota exige ficha completa. Operador nao consegue avaliar motoboy especifico. | wave-5 |
| D-042 | pain | operador | Motoboy nao aparece no mapa. Multiplas causas: status offline, GPS negado, intervalo 30s, SSE desconectado, stale markers. Feature core nao confiavel. | 8 | Mapa real-time e a vitrine do produto. Se nao funciona, produto parece quebrado. | wave-5 |
| D-043 | pain | todos | Interfaces incompletas para operacao real. Gaps em cada app: sem timeline visual, sem estimativa custo, sem filtros historico, sem navegacao externa, sem notificacao sonora. | 8 | Diferenca entre "demo funcional" e "producao real". Cumulativo. | wave-5 |
| G-030 | gain | lojista | Autocomplete de enderecos com geocoding. Stack: ViaCEP (CEP) + Nominatim/HERE (busca textual) + Leaflet pin drop. Dropdown fluido com sugestoes. | 9 | Resolve D-035/D-037. Elimina atrito #1 do lojista. | wave-5 |
| G-031 | gain | lojista | Enderecos salvos e favoritos. Entidade saved_addresses. Auto-save. Favoritos com label. Selecao rapida no formulario de pedido. | 8 | Resolve D-036. Elimina repeticao diaria para lojistas de alto volume. | wave-5 |
| G-032 | gain | lojista | Gestao de enderecos (CRUD). Tela "Meus Enderecos": criar, editar, excluir, favoritar. Autocomplete integrado. Preview no mapa. | 7 | Resolve D-038. Organizacao para uso intenso. | wave-5 |
| G-033 | gain | operador | CRUD completo de lojas. Detalhes com historico + financeiro. Edicao inline. Status management. Mapa com pin. | 8 | Resolve D-040. Gestao real de lojas. | wave-5 |
| G-034 | gain | operador | CRUD completo de motoboys. Ficha completa: metricas, earnings, mapa, timeline de status, documentos. Detalhes + editar + historico. | 8 | Resolve D-041. Gestao real de frota. | wave-5 |
| G-035 | gain | operador | Fix tracking motoboy + diagnostico visual. Badge GPS, banner alerta no app motoboy, update imediato ao ficar online, stale cleanup, auto-fit map. | 8 | Resolve D-042. Feature core confiavel. | wave-5 |
| G-036 | gain | todos | Quality pass interfaces. Central: metricas hoje + timeline visual + bulk actions. Lojista: estimativa custo + filtros. Motoboy: navegacao + notif sonora + info pre-aceitar. | 8 | Resolve D-043. Producao real, nao demo. | wave-5 |

---

## Reclassificacoes wave-5

| ID | Score anterior | Score novo | Direcao | Motivo |
|---|---|---|---|---|
| D-006 | 7 | 7 | → | Validacao Zod existe mas autocomplete (wave-5) resolve melhor. Sem reclassificacao. |

Nenhuma reclassificacao significativa. Wave 5 introduz dominio novo (enderecos, completude) sem alterar scores existentes.

---

## Tabela acumulada — Itens NAO implementados (ordenado por score)

| Score | ID | Tipo | Perfil | Descricao | Wave |
|---|---|---|---|---|---|
| 9 | D-027 | pain | empresario | Rotas API sem role-check. | wave-4 |
| 9 | D-030 | pain | motoboy | Login apenas email+senha. | wave-4 |
| 9 | D-035 | pain | lojista | Endereco 100% manual. | wave-5 |
| 9 | G-022 | gain | empresario | RBAC granular. | wave-4 |
| 9 | G-025 | gain | motoboy | Login OTP WhatsApp. | wave-4 |
| 9 | G-030 | gain | lojista | Autocomplete enderecos + geocoding. | wave-5 |
| 8 | D-019 | pain | empresario | Periculosidade 30% compliance. | wave-2 |
| 8 | D-028 | pain | empresario | Sem super admin. | wave-4 |
| 8 | D-029 | pain | empresario | Sem gestao times. | wave-4 |
| 8 | D-032 | pain | todos | Sem edicao perfil. | wave-4 |
| 8 | D-036 | pain | lojista | Sem enderecos salvos. | wave-5 |
| 8 | D-037 | pain | lojista | Sem geocoding (lat=0). | wave-5 |
| 8 | D-040 | pain | operador | CRUD lojas incompleto. | wave-5 |
| 8 | D-041 | pain | operador | CRUD motoboys incompleto. | wave-5 |
| 8 | D-042 | pain | operador | Motoboy nao aparece mapa. | wave-5 |
| 8 | D-043 | pain | todos | Interfaces incompletas. | wave-5 |
| 8 | G-023 | gain | super_admin | Super admin cross-company. | wave-4 |
| 8 | G-024 | gain | empresario | Gestao completa usuarios. | wave-4 |
| 8 | G-027 | gain | todos | Edicao completa perfil. | wave-4 |
| 8 | G-031 | gain | lojista | Enderecos salvos/favoritos. | wave-5 |
| 8 | G-033 | gain | operador | CRUD completo lojas. | wave-5 |
| 8 | G-034 | gain | operador | CRUD completo motoboys. | wave-5 |
| 8 | G-035 | gain | operador | Fix tracking motoboy. | wave-5 |
| 8 | G-036 | gain | todos | Quality pass interfaces. | wave-5 |
| 7 | D-005 | pain | empresario | Rotas mal planejadas. | wave-1 |
| 7 | D-020 | pain | empresario | Alta rotatividade motoboys. | wave-2 |
| 7 | D-021 | pain | lojista | Sem ETA lojista. | wave-2 |
| 7 | D-024 | pain | empresario | Dispatch manual gargalo. | wave-3 |
| 7 | D-031 | pain | empresario | Sem self-registration. | wave-4 |
| 7 | D-033 | pain | motoboy | Sem avatar. | wave-4 |
| 7 | D-034 | pain | empresario | Sem config canais OTP. | wave-4 |
| 7 | D-038 | pain | lojista | Sem gestao enderecos. | wave-5 |
| 7 | D-039 | pain | lojista | Sem pin drop. | wave-5 |
| 7 | G-015 | gain | empresario | Dispatch inteligente. | wave-2 |
| 7 | G-016 | gain | lojista | Link rastreamento. | wave-2 |
| 7 | G-018 | gain | lojista | ETA basico. | wave-3 |
| 7 | G-019 | gain | lojista | Pagina publica rastreamento. | wave-3 |
| 7 | G-026 | gain | lojista | OTP Email. | wave-4 |
| 7 | G-028 | gain | todos | Avatar crop rico. | wave-4 |
| 7 | G-029 | gain | empresario | Config canais OTP. | wave-4 |
| 7 | G-032 | gain | lojista | Gestao enderecos CRUD. | wave-5 |
| 6 | D-022 | pain | lojista | Sem notif cliente final. | wave-2 |
| 6 | D-025 | pain | lojista | Sem notif fora do app. | wave-3 |
| 6 | D-026 | pain | empresario | Sem simulador regulatorio. | wave-3 |
| 6 | G-005 | gain | empresario | IA progressiva. | wave-1 |
| 6 | G-021 | gain | empresario | Webhook/WhatsApp notif. | wave-3 |
| 5 | G-020 | gain | motoboy | Ranking entregadores. | wave-3 |
| 4 | D-016 | pain | motoboy | Sem roteirizacao. | wave-1 |
| 3 | D-009 | pain | empresario | Resiliencia operacional. | wave-1 |

---

## Resumo estatistico — Wave 5 acumulado

| Metrica | Wave 4 | Wave 5 (acumulado) |
|---|---|---|
| Total discoveries | 60 | 76 |
| Dores (pain) | 34 | 43 |
| Ganhos (gain) | 26 | 33 |
| Score medio | 7.3 | 7.3 |
| Items score >= 8 | 33 | 48 |
| Items score >= 9 | 14 | 20 |
| Implementados | 29 | 29 |
| Nao implementados | 29 | 45 |
| Parciais | 2 | 2 |
| Novas discoveries wave-5 | — | 16 |

### Wave 5 — score distribution (novas discoveries)

| Score | Qtd | Items |
|---|---|---|
| 9 | 2 | D-035, G-030 |
| 8 | 12 | D-036, D-037, D-040, D-041, D-042, D-043, G-031, G-033, G-034, G-035, G-036 |
| 7 | 2 | D-038, D-039, G-032 |

**Media novas discoveries wave-5**: 8.0

---

## Cobertura por perfil

| Perfil | Dores wave-5 | Ganhos wave-5 | Total |
|---|---|---|---|
| Lojista | D-035, D-036, D-037, D-038, D-039 | G-030, G-031, G-032 | 8 |
| Operador | D-040, D-041, D-042 | G-033, G-034, G-035 | 6 |
| Todos | D-043 | G-036 | 2 |
