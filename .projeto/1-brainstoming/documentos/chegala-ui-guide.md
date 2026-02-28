# Chega.la - Guia de UI/UX

Padroes de interface para os tres modulos do Chega.la. Branding obrigatorio. Componentes shadcn/ui com Tailwind CSS.

---

## Principio Fundamental

**Usar branding Chega.la. Usar componentes shadcn/ui. Nao inventar.**

---

## Tokens Semanticos

### Cores

| Token | Valor (Light) | Valor (Dark) | Uso |
|-------|---------------|--------------|-----|
| `--primary` | #222e6e (Azul Marinho) | #222e6e | CTAs, headers, botoes principais |
| `--primary-foreground` | #ffffff | #ffffff | Texto sobre primary |
| `--secondary` | #1dace7 (Azul Claro) | #1dace7 | Links, icones, estados ativos |
| `--secondary-foreground` | #ffffff | #ffffff | Texto sobre secondary |
| `--accent` | #fca322 (Alaranjado) | #fca322 | Badges, alertas, destaques, precos |
| `--accent-foreground` | #222e6e | #ffffff | Texto sobre accent |
| `--destructive` | #ef4444 | #ef4444 | Cancelar, excluir, erros |
| `--destructive-foreground` | #ffffff | #ffffff | Texto sobre destructive |
| `--background` | #ffffff | #0f172a | Fundo da pagina |
| `--foreground` | #0f172a | #f8fafc | Texto principal |
| `--muted` | #f1f5f9 | #1e293b | Fundos secundarios, cards |
| `--muted-foreground` | #64748b | #94a3b8 | Texto secundario, placeholders |
| `--border` | #e2e8f0 | #334155 | Bordas de cards, inputs |
| `--ring` | #1dace7 | #1dace7 | Focus ring dos inputs |
| `--success` | #22c55e | #22c55e | Entregue, ativo, online |
| `--warning` | #fca322 | #fca322 | Pendente, atenção |

### Uso Correto

```tsx
// ❌ PROIBIDO — cores hardcoded
<button className="bg-[#222e6e] text-white">Confirmar</button>
<span className="text-[#fca322]">R$ 15,00</span>

// ✅ OBRIGATORIO — tokens semanticos
<Button variant="default">Confirmar</Button>
<span className="text-accent">R$ 15,00</span>
```

### Regra de Branding

```tsx
// ❌ PROIBIDO — texto generico ou icone padrao
<h1>App de Entregas</h1>
<img src="/generic-icon.png" />

// ✅ OBRIGATORIO — assets SVG do Chega.la
<img src="/brand/light/logo+brand-horizontal.svg" alt="Chega.la" />
```

Assets SVG em `.projeto/2-brand/light/` e `.projeto/2-brand/dark/`. Ver BRAND.md e GUIDE.md para regras de uso.

---

## Tipografia

| Classe | Tamanho | Uso |
|--------|---------|-----|
| `text-xs` | 12px | Labels minusculos, badges |
| `text-sm` | 14px | Texto secundario, metadata, tabelas |
| `text-base` | 16px | Texto principal, formularios |
| `text-lg` | 18px | Subtitulos de secao |
| `text-xl` | 20px | Titulos de pagina |
| `text-2xl` | 24px | Contadores, metricas grandes |
| `text-3xl` | 30px | Dashboard hero numbers |

---

## Componentes

### Layout

| Componente | Uso |
|------------|-----|
| `Sidebar` | Navegacao principal (Central da Empresa — desktop) |
| `BottomNav` | Navegacao principal (Apps Lojista e Motoboy — mobile) |
| `Card` | Containers de conteudo, pedidos, metricas |
| `Sheet` | Painel lateral para detalhes (mobile) |
| `Dialog` | Modais de confirmacao e formularios curtos |
| `Tabs` | Alternancia de visualizacao (pedidos ativos/historico) |

### Formularios

| Componente | Uso |
|------------|-----|
| `Form` | Wrapper React Hook Form + Zod |
| `Input` | Campo de texto, email, telefone |
| `Textarea` | Observacoes, instrucoes |
| `Select` | Selecao de status, tipo de veiculo |
| `DatePicker` | Agendamento, filtro de periodo |
| `RadioGroup` | Tipo de mercadoria, forma de pagamento |
| `Switch` | Toggle de disponibilidade (motoboy) |

### Acoes

| Componente | Uso |
|------------|-----|
| `Button variant="default"` | Acao principal (criar pedido, confirmar) |
| `Button variant="secondary"` | Acao secundaria (filtrar, exportar) |
| `Button variant="destructive"` | Cancelar pedido, bloquear motoboy |
| `Button variant="outline"` | Acoes terciarias (voltar, fechar) |
| `Button variant="ghost"` | Acoes minimas (editar inline, mais opcoes) |

### Feedback

| Componente | Uso |
|------------|-----|
| `Badge variant="default"` | Status: assigned, in_transit |
| `Badge variant="secondary"` | Status: pending |
| `Badge variant="destructive"` | Status: cancelled, failed |
| `Badge` (custom success) | Status: delivered |
| `Badge` (custom warning) | Status: picked_up |
| `Alert` | Mensagens de sistema, alertas de anomalia |
| `Toast` (sonner) | Confirmacoes de acao, notificacoes |
| `Skeleton` | Loading state |

### Dados

| Componente | Uso |
|------------|-----|
| `Table` (tanstack) | Listagem de pedidos, motoboys, lojistas |
| `DataTable` | Table com sort, filtro, paginacao |
| `ScrollArea` | Listas longas em paineis laterais |

### Sobreposicoes

| Componente | Uso |
|------------|-----|
| `Dialog` | Confirmacoes (cancelar pedido, fechar caixa) |
| `Sheet` | Detalhes de pedido/entrega em mobile |
| `Popover` | Filtros avancados, selecao de motoboy |
| `DropdownMenu` | Menu de acoes por item (editar, transferir, cancelar) |

---

## Padroes de Pagina

### Dashboard (Central da Empresa)

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <MetricCard label="Pedidos Ativos" value={activOrders} icon={Package} />
  <MetricCard label="Motoboys Online" value={onlineCouriers} icon={Bike} />
  <MetricCard label="Entregas Hoje" value={todayDeliveries} icon={CheckCircle} />
  <MetricCard label="Faturamento" value={revenue} icon={DollarSign} />
</div>

<div className="grid gap-4 lg:grid-cols-3">
  <Card className="lg:col-span-2">
    <LiveMap couriers={couriers} deliveries={activeDeliveries} />
  </Card>
  <Card>
    <OrdersFeed orders={recentOrders} />
  </Card>
</div>
```

### Lista com Busca e Filtros

```tsx
<div className="flex items-center gap-4">
  <Input placeholder="Buscar pedido..." value={search} onChange={setSearch} />
  <Select value={statusFilter} onValueChange={setStatusFilter}>
    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Todos</SelectItem>
      <SelectItem value="pending">Pendente</SelectItem>
      <SelectItem value="in_transit">Em Transito</SelectItem>
    </SelectContent>
  </Select>
  <DateRangePicker value={dateRange} onChange={setDateRange} />
</div>

<DataTable columns={orderColumns} data={filteredOrders} />
```

### Formulario de Pedido

```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    <Card>
      <CardHeader><CardTitle>Coleta</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <FormField name="senderName" render={...} />
        <AddressAutocomplete name="pickupAddress" />
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Entrega</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <FormField name="recipientName" render={...} />
        <AddressAutocomplete name="deliveryAddress" />
      </CardContent>
    </Card>

    <PriceEstimate distance={distance} duration={duration} price={price} />

    <Button type="submit" className="w-full">Confirmar Pedido</Button>
  </form>
</Form>
```

### Detalhe de Entrega (Timeline)

```tsx
<Card>
  <CardHeader>
    <div className="flex justify-between">
      <CardTitle>Pedido #{order.orderNumber}</CardTitle>
      <StatusBadge status={order.status} />
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <DeliveryMap courier={courier} pickup={pickup} delivery={delivery} />
      <EventTimeline events={deliveryEvents} />
      <ProofGallery proofs={proofs} />
    </div>
  </CardContent>
</Card>
```

---

## Mapas

### Tecnologia

Leaflet + react-leaflet para todos os mapas. Tiles OpenStreetMap (sem custo de API).

### Marcadores

| Elemento | Cor | Icone |
|----------|-----|-------|
| Motoboy disponivel | `--success` (#22c55e) | Bike |
| Motoboy em entrega | `--secondary` (#1dace7) | Bike |
| Motoboy inativo | `--destructive` (#ef4444) | AlertTriangle |
| Ponto de coleta | `--primary` (#222e6e) | MapPin |
| Ponto de entrega | `--accent` (#fca322) | MapPin |
| Parada intermediaria | `--muted-foreground` | Circle |

### Rota

Linha tracejada `--secondary` (#1dace7) conectando coleta → paradas → entrega.

---

## Status Badges — Mapeamento

| Status | Variante | Label (pt-BR) | Cor |
|--------|----------|---------------|-----|
| pending | secondary | Pendente | muted |
| accepted | default | Aceito | primary |
| assigned | default | Atribuido | primary |
| picked_up | custom | Coletado | warning (#fca322) |
| in_transit | custom | Em Transito | secondary (#1dace7) |
| delivered | custom | Entregue | success (#22c55e) |
| cancelled | destructive | Cancelado | destructive |
| returned | destructive | Devolvido | destructive |
| failed | destructive | Falhou | destructive |

---

## Modulos — Layout por Dispositivo

### Central da Empresa (Desktop-first)

```
┌──────────────────────────────────────────────┐
│ Sidebar (240px)  │  Content Area             │
│ ┌──────────────┐ │  ┌────────────────────┐   │
│ │ Logo         │ │  │ Header + Breadcrumb│   │
│ │ Dashboard    │ │  ├────────────────────┤   │
│ │ Pedidos      │ │  │                    │   │
│ │ Motoboys     │ │  │  Main Content      │   │
│ │ Lojistas     │ │  │                    │   │
│ │ Financeiro   │ │  │                    │   │
│ │ Metricas     │ │  │                    │   │
│ │ Config       │ │  └────────────────────┘   │
│ └──────────────┘ │                           │
└──────────────────────────────────────────────┘
```

### App do Lojista e Motoboy (Mobile-first)

```
┌──────────────────┐
│ Header + Logo    │
├──────────────────┤
│                  │
│  Main Content    │
│  (scrollable)    │
│                  │
├──────────────────┤
│ BottomNav        │
│ [Home][+][Track] │
└──────────────────┘
```

---

## Estados

### Loading

```tsx
<div className="space-y-4">
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-full" />
</div>
```

### Empty State

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <Package className="h-12 w-12 text-muted-foreground mb-4" />
  <h3 className="text-lg font-medium">Nenhum pedido encontrado</h3>
  <p className="text-sm text-muted-foreground mt-1">
    Crie seu primeiro pedido para comecar.
  </p>
  <Button className="mt-4">Novo Pedido</Button>
</div>
```

### Error State

```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Erro ao carregar pedidos</AlertTitle>
  <AlertDescription>
    Nao foi possivel conectar ao servidor. Tente novamente.
    <Button variant="outline" size="sm" className="mt-2" onClick={retry}>
      Tentar novamente
    </Button>
  </AlertDescription>
</Alert>
```

### Offline State (Motoboy)

```tsx
<Alert>
  <WifiOff className="h-4 w-4" />
  <AlertTitle>Sem conexao</AlertTitle>
  <AlertDescription>
    Suas atualizacoes de localizacao serao enviadas quando a conexao voltar.
  </AlertDescription>
</Alert>
```

---

## Acessibilidade

- [ ] Todos os inputs tem labels associados (htmlFor)
- [ ] Imagens tem alt text descritivo
- [ ] Contraste minimo 4.5:1 para texto (WCAG AA)
- [ ] Focus visible em todos os elementos interativos (ring)
- [ ] Navegacao por teclado funcional (Tab, Enter, Escape)
- [ ] Aria-labels em botoes com icone sem texto
- [ ] Roles semanticos em tabelas e listas
- [ ] Status announcements via aria-live para atualizacoes SSE
- [ ] Touch targets minimo 44x44px em mobile
- [ ] Reducao de movimento respeitada (prefers-reduced-motion)
