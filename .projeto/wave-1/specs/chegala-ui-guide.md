# Chega.la - Guia de UI/UX Wave 1

Padroes visuais e de interacao para os tres modulos PWA do Chega.la: Central da Empresa, App do Lojista e App do Motoboy.

---

## Principio Fundamental

**Mobile-first, tokens semanticos, branding Chega.la em tudo.**

---

## Tokens Semanticos

### Cores

| Token | Valor | Uso |
|-------|-------|-----|
| primary | #222e6e | Headers, botoes primarios, backgrounds principais |
| primary-foreground | #ffffff | Texto sobre primary |
| secondary | #1dace7 | Links, botoes secundarios, elementos interativos |
| secondary-foreground | #ffffff | Texto sobre secondary |
| accent | #fca322 | Badges, alertas positivos, destaques |
| accent-foreground | #1a1a1a | Texto sobre accent |
| destructive | hsl(0 84% 60%) | Cancelar, erros |
| background | #ffffff | Fundo da pagina |
| foreground | #1a1a1a | Texto principal |
| muted | #f4f4f5 | Backgrounds secundarios, cards |
| muted-foreground | #71717a | Texto secundario |
| border | #e4e4e7 | Bordas de cards e inputs |

### Uso Correto

```tsx
// ❌ PROIBIDO — cores hardcoded
<div className="bg-blue-900 text-white">

// ✅ OBRIGATORIO — tokens semanticos
<div className="bg-primary text-primary-foreground">
```

---

## Tipografia

| Classe | Tamanho | Uso |
|--------|---------|-----|
| text-2xl font-bold | 24px | Titulo da pagina |
| text-lg font-semibold | 18px | Titulo de secao, card header |
| text-base | 16px | Texto corpo |
| text-sm | 14px | Labels, texto secundario |
| text-xs | 12px | Metadata, timestamps |

---

## Logo

| Regra | Detalhe |
|-------|---------|
| Formato | SVG (nunca texto generico, nunca PNG) |
| Posicao | Header de cada modulo, canto superior esquerdo |
| Variantes | Logo completo (desktop), icone (mobile, favicon) |
| Fonte | `.projeto/2-brand/` (assets SVG) |

---

## Componentes

### Layout

| Componente | Uso |
|------------|-----|
| AppShell | Layout principal com header + content |
| Header | Logo + navegacao + usuario |
| Sidebar (Central) | Navegacao lateral no desktop |
| BottomNav (Lojista/Motoboy) | Navegacao inferior mobile |

### Formularios

| Componente | Uso |
|------------|-----|
| Form | Wrapper com React Hook Form + Zod |
| Input | Campo de texto |
| Textarea | Observacoes, notas |
| Button | Acoes (variantes: default, secondary, destructive, outline) |
| Select | Selecao de opcoes |

### Dados

| Componente | Uso |
|------------|-----|
| Card | Container de informacao |
| Badge | Status do pedido, status do motoboy |
| Table (Central) | Listas de dados tabulares |
| List (Lojista/Motoboy) | Cards empilhados mobile-friendly |

### Mapas

| Componente | Uso |
|------------|-----|
| MapView | Wrapper do Leaflet com tiles OpenStreetMap |
| CourierMarker | Marcador do motoboy (icone diferenciado por status) |
| OrderRoute | Linha entre coleta e entrega |

### Feedback

| Componente | Uso |
|------------|-----|
| Toast | Notificacoes temporarias (sucesso, erro) |
| Skeleton | Loading placeholder |
| EmptyState | Quando nao ha dados para exibir |
| Alert | Mensagens informativas ou de erro |

---

## Padroes de Pagina

### Lista com Filtro (Central — Pedidos)

```tsx
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-bold">Pedidos</h1>
    <Button>Novo Pedido</Button>
  </div>
  <div className="flex gap-2">
    <Badge variant={filter === 'all' ? 'default' : 'outline'}>Todos</Badge>
    <Badge variant={filter === 'pending' ? 'default' : 'outline'}>Pendentes</Badge>
    <Badge variant={filter === 'in_transit' ? 'default' : 'outline'}>Em Transito</Badge>
  </div>
  <div className="space-y-2">
    {orders.map(order => <OrderCard key={order.id} order={order} />)}
  </div>
</div>
```

### Formulario (Lojista — Nova Entrega)

```tsx
<Card>
  <CardHeader>
    <CardTitle>Nova Entrega</CardTitle>
  </CardHeader>
  <CardContent>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField name="deliveryAddress" label="Endereco de entrega" />
        <FormField name="recipientName" label="Nome do destinatario" />
        <FormField name="recipientPhone" label="Telefone" />
        <FormField name="notes" label="Observacoes" />
        <Button type="submit" className="w-full">Solicitar Entrega</Button>
      </form>
    </Form>
  </CardContent>
</Card>
```

### Acao com Status (Motoboy — Entrega Ativa)

```tsx
<Card>
  <CardHeader>
    <CardTitle>Entrega #{orderNumber}</CardTitle>
    <Badge>{status}</Badge>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <p className="text-sm text-muted-foreground">Coleta</p>
      <p>{pickupAddress}</p>
    </div>
    <div>
      <p className="text-sm text-muted-foreground">Entrega</p>
      <p>{deliveryAddress}</p>
    </div>
    {notes && <p className="text-sm">{notes}</p>}
  </CardContent>
  <CardFooter>
    <Button className="w-full" onClick={nextStatus}>
      {statusAction[status]}
    </Button>
  </CardFooter>
</Card>
```

---

## Status Badges

| Status | Cor | Label (pt-BR) |
|--------|-----|---------------|
| pending | muted | Pendente |
| assigned | secondary | Atribuido |
| picked_up | accent | Coletado |
| in_transit | secondary | Em Transito |
| delivered | primary | Entregue |
| cancelled | destructive | Cancelado |
| available | secondary | Disponivel |
| busy | accent | Ocupado |
| offline | muted | Offline |

---

## Estados

### Loading

```tsx
<div className="space-y-2">
  <Skeleton className="h-20 w-full" />
  <Skeleton className="h-20 w-full" />
  <Skeleton className="h-20 w-full" />
</div>
```

### Empty State

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <PackageOpen className="h-12 w-12 text-muted-foreground mb-4" />
  <h3 className="text-lg font-semibold">Nenhum pedido encontrado</h3>
  <p className="text-sm text-muted-foreground">Crie o primeiro pedido para comecar.</p>
  <Button className="mt-4">Novo Pedido</Button>
</div>
```

### Error State

```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Erro</AlertTitle>
  <AlertDescription>Nao foi possivel carregar os pedidos. Tente novamente.</AlertDescription>
</Alert>
```

---

## Responsividade

| Breakpoint | Comportamento |
|------------|---------------|
| < 768px (mobile) | BottomNav, cards empilhados, formularios full-width |
| >= 768px (tablet) | Sidebar colapsavel, cards em grid 2 colunas |
| >= 1024px (desktop) | Sidebar fixa, mapa + lista lado a lado |

---

## Acessibilidade

- [ ] Todos os inputs tem labels associados
- [ ] Botoes tem texto descritivo (nao so icone)
- [ ] Contraste minimo 4.5:1 (WCAG AA)
- [ ] Navegacao por teclado funcional
- [ ] Status do pedido anunciado por screen readers
- [ ] Mapa tem descricao alternativa textual
- [ ] Focus visible em elementos interativos

---

## Modulos — Navegacao

### Central da Empresa (desktop-first)

| Item | Rota | Icone |
|------|------|-------|
| Dashboard | / | LayoutDashboard |
| Pedidos | /pedidos | Package |
| Motoboys | /motoboys | Bike |
| Lojistas | /lojistas | Store |
| Mapa | /mapa | Map |

### App do Lojista (mobile-first)

| Item | Rota | Icone |
|------|------|-------|
| Pedidos | / | Package |
| Nova Entrega | /nova | Plus |
| Historico | /historico | Clock |

### App do Motoboy (mobile-first)

| Item | Rota | Icone |
|------|------|-------|
| Entregas | / | Package |
| Historico | /historico | Clock |
| Status | /status | Circle |
