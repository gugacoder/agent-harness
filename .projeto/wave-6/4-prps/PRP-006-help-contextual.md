---
status: current
wave: 6
depends_on: [PRP-005-docs-inapp]
---

# PRP-006 — Help Contextual: Tooltips, Empty States e Links de Ajuda

## Objetivo

Adicionar help contextual nos 3 apps: tooltips em campos criticos, empty states educativos com CTA e links de ajuda no header de cada pagina.

## Execution Mode

`implementar`

## Contexto

### Componentes existentes

**EmptyState — Central** (`apps/central/src/components/ui/EmptyState.tsx`):
```typescript
interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}
```
Aceita `action` como ReactNode generico. Nao tem props de link de ajuda.

**EmptyState — Motoboy** (`apps/motoboy/src/components/ui/EmptyState.tsx`):
Mesmo padrao. Props: `{ icon, title, description }`. NAO tem prop `action`.

**EmptyState — Lojista** (`apps/lojista/src/components/ui/EmptyState.tsx`):
Mesmo padrao da Central com prop `action`.

### Tooltips

O projeto NAO tem componente de tooltip. Nao usa shadcn/ui nem Radix UI diretamente (apesar de ter `@hookform/resolvers`). Os apps usam Tailwind puro com componentes custom.

### Paginas que precisam de help

**Central**: ConfiguracaoPage (POD, periodo fechamento), PrecosPage (taxa/km, sobretaxas), PedidosPage (empty), MotoboysPage (empty), MapaPage (empty), LojistasPage (empty).
**Motoboy**: EntregasPage (empty), StatusPage.
**Lojista**: PedidosPage (empty), HistoricoPage (empty).

### Dependencia

PRP-005 deve estar implementado (rotas /docs existem para que links de ajuda funcionem).

## Especificacao

### 1. Componente HelpTooltip

Criar em cada app: `components/ui/HelpTooltip.tsx` (mesmo componente copiado, pois apps sao builds separados).

Props:
```typescript
interface HelpTooltipProps {
  content: string
  learnMoreUrl?: string
}
```

Implementacao:
- Icone `HelpCircle` (lucide-react), 16px, `text-muted-foreground`, `cursor-help`.
- Posicionamento: inline, usar ao lado do label de campos.
- Tooltip: `div` posicionado absolutamente, visivel no hover (desktop) ou click (mobile).
- Estilo: `bg-popover text-popover-foreground rounded-md shadow-md px-3 py-2 text-xs max-w-[240px] z-50`.
- Se `learnMoreUrl` existe: link "Saiba mais" no final do tooltip (`text-primary underline`).
- Trigger: `onMouseEnter`/`onMouseLeave` (desktop) + `onClick` toggle (mobile). Usar estado local.
- Delay de abertura: 200ms via setTimeout. Cancelar se mouse sair antes.
- Posicao: acima do icone por padrao. Se nao couber (verificar viewport), posicionar abaixo.
- Acessibilidade: `aria-describedby` no icone, `role="tooltip"` no conteudo.

### 2. Tooltips em campos criticos (Central)

Adicionar HelpTooltip nos seguintes campos:

**ConfiguracaoPage.tsx:**

| Campo | Conteudo do tooltip | learnMoreUrl |
|-------|-------------------|--------------|
| Periodo de fechamento | Define de quanto em quanto tempo o sistema calcula os ganhos dos motoboys (diario, semanal, mensal) | /docs#financeiro |
| POD obrigatorio | Quando ativado, motoboys precisam tirar foto e coletar assinatura para confirmar a entrega | /docs#configuracao |

**PrecosPage.tsx** (nos campos de edicao de regras):

| Campo | Conteudo do tooltip | learnMoreUrl |
|-------|-------------------|--------------|
| Valor base | Valor fixo cobrado em toda entrega, independente da distancia | /docs#precos |
| Valor por km | Valor adicional cobrado por quilometro rodado | /docs#precos |
| Sobretaxa chuva | Acrescimo aplicado quando chove. Ex: 20% = entrega de R$10 vira R$12 | /docs#precos |

Integracao: adicionar `<HelpTooltip>` inline ao lado do `<label>` de cada campo, envolvidos em `<div className="flex items-center gap-1.5">`.

### 3. Empty states educativos (Central)

Atualizar as chamadas existentes de `<EmptyState>` nas paginas da Central:

| Pagina | Prop atual (title) | Novo title | Novo description | action |
|--------|-------------------|-----------|-----------------|--------|
| PedidosPage | (verificar existente) | Nenhum pedido ainda | Seus lojistas podem criar pedidos pelo app ou voce pode criar manualmente. | `<button>Criar pedido</button>` que navega para criacao |
| MotoboysPage | (verificar existente) | Nenhum motoboy cadastrado | Convide seu primeiro motoboy para comecar a operar. | `<button>Cadastrar motoboy</button>` que abre formulario |
| LojistasPage | (verificar existente) | Nenhuma loja cadastrada | Cadastre sua primeira loja para comecar a receber pedidos. | `<button>Cadastrar loja</button>` que abre formulario |
| MapaPage | (verificar existente) | Nenhum motoboy online | Quando motoboys ficarem online, aparecerao aqui no mapa. | — (sem acao) |

### 4. Empty states educativos (Motoboy)

Adicionar prop `action` ao EmptyState do Motoboy se nao existir.

| Pagina | Novo title | Novo description | action |
|--------|-----------|-----------------|--------|
| EntregasPage (sem entrega ativa) | Nenhuma entrega ainda | Fique online para comecar a receber entregas. | `<button>Ficar online</button>` que navega para /status |

### 5. Empty states educativos (Lojista)

| Pagina | Novo title | Novo description | action |
|--------|-----------|-----------------|--------|
| PedidosPage (lista vazia) | Nenhum pedido ativo | Crie seu primeiro pedido de entrega. | `<button>Criar pedido</button>` que navega para /nova |
| HistoricoPage (lista vazia) | Nenhuma entrega no historico | Crie seu primeiro pedido para comecar. | `<button>Criar pedido</button>` que navega para /nova |

### 6. Componente PageHelpLink

Criar em cada app: `components/ui/PageHelpLink.tsx`.

Props:
```typescript
interface PageHelpLinkProps {
  url: string
}
```

- Icone `HelpCircle` (lucide-react), 20px.
- Tooltip nativo (atributo `title="Ajuda"`).
- Click navega para `url` (link interno, usa `useNavigate` ou `<Link>`).
- Estilo: `text-muted-foreground hover:text-foreground transition-colors`.

### 7. Integracao do PageHelpLink nos headers

Adicionar `<PageHelpLink>` no header/titulo de cada pagina principal:

**Central:**

| Pagina | url |
|--------|-----|
| DashboardPage | /docs#dashboard |
| PedidosPage | /docs#pedidos |
| MotoboysPage | /docs#motoboys |
| LojistasPage | /docs#lojas |
| MapaPage | /docs#mapa |
| PrecosPage | /docs#precos |
| FinanceiroPage | /docs#financeiro |
| FaturasPage | /docs#faturas |
| AnalyticsPage | /docs#analytics |
| ConfiguracaoPage | /docs#configuracao |

**Motoboy:**

| Pagina | url |
|--------|-----|
| EntregasPage | /docs#entregas |
| StatusPage | /docs#status |
| HistoricoPage | /docs#historico (se existir; senao, /docs) |
| ExtratoPage | /docs#ganhos |

**Lojista:**

| Pagina | url |
|--------|-----|
| PedidosPage | /docs#acompanhar |
| NovaEntregaPage | /docs#criar-pedido |
| HistoricoPage | /docs#historico |
| FaturasPage | /docs#faturas |

Posicao: ao lado do titulo da pagina (`<h1>`) no canto direito, ou no header se a pagina nao tem titulo visivel. Usar `<div className="flex items-center justify-between">` para acomodar titulo + icone.

### 8. Rodape de ajuda (opcional)

Se as paginas tiverem espaco, adicionar rodape discreto:
```
<p className="text-xs text-muted-foreground text-center mt-8">
  Precisa de ajuda? <Link to="/docs" className="text-primary underline">Guia de uso</Link> · <Link to="/docs#faq" className="text-primary underline">FAQ</Link>
</p>
```

Adicionar nas paginas principais de cada app (nao em todas). Sugestao:
- Central: DashboardPage, ConfiguracaoPage
- Motoboy: StatusPage
- Lojista: PedidosPage

## Limites

- NAO instalar Radix UI, Floating UI, Tippy ou qualquer lib de tooltip. Implementar com CSS puro (position absolute + hover state).
- NAO alterar a estrutura de layout (AppShell, Sidebar, BottomNav) alem de adicionar o necessario.
- NAO modificar a logica de negocio das paginas. Apenas adicionar elementos visuais de help.
- NAO criar tooltips para TODOS os campos. Apenas os listados na especificacao (campos criticos que impactam comportamento do sistema).
- NAO adicionar dependencias npm.
- Ajustar textos existentes de EmptyState de forma cirurgica — nao refatorar o componente inteiro. Se o EmptyState do Motoboy nao tem prop `action`, adicionar a prop.
- Se uma pagina NAO usa EmptyState atualmente, NAO adicionar. Apenas melhorar os que ja existem.
