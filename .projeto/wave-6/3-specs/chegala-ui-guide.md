# Chega.la - Guia de UI/UX Wave 6: Padroes de Onboarding e Help

Padroes visuais e de interacao para wizard, tutorial, overlay guiado, tooltips e empty states educativos.

---

## Principio Fundamental

**Ensinar sem atrapalhar. Onboarding e help sao convites, nao barreiras.**

---

## Padroes de Onboarding

### Wizard (Central — operador)

| Aspecto | Padrao |
|---------|--------|
| Layout | Tela cheia com fundo overlay semi-transparente |
| Progresso | Stepper horizontal no topo com numeros (1/5, 2/5...) |
| Navegacao | Botoes "Anterior" e "Proximo" no rodape. "Pular" alinhado a direita |
| Transicao | Slide horizontal, 200ms ease-out |
| Feedback | Checkmark verde animado ao completar step |
| Responsividade | Desktop: card centralizado max-w-2xl. Mobile: tela cheia |

```tsx
// ✅ OBRIGATORIO — Estrutura do wizard
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
  <Card className="w-full max-w-2xl">
    <WizardProgress currentStep={step} totalSteps={5} />
    <CardContent>
      {/* Step content */}
    </CardContent>
    <CardFooter className="flex justify-between">
      <Button variant="ghost" onClick={onPrev} disabled={step === 0}>
        Anterior
      </Button>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onSkip}>Pular</Button>
        <Button onClick={onNext}>Proximo</Button>
      </div>
    </CardFooter>
  </Card>
</div>
```

```tsx
// ❌ PROIBIDO — Wizard sem indicador de progresso
<Card>
  <CardContent>{/* step content sem stepper */}</CardContent>
</Card>
```

### Tutorial (Motoboy)

| Aspecto | Padrao |
|---------|--------|
| Layout | Tela cheia, fundo colorido suave (bg-primary/5) |
| Navegacao | Swipe horizontal + dots indicator no rodape |
| Conteudo | Icone grande (48px) + titulo (text-xl) + descricao (text-sm, max 2 linhas) |
| Skip | Botao "Pular" fixo no topo direito |
| Ultima tela | CTA primario "Ficar online agora" em destaque |
| Transicao | Slide horizontal acompanhando swipe, spring 200ms |

```tsx
// ✅ OBRIGATORIO — Slide do tutorial
<div className="flex flex-col items-center justify-center h-full px-6 text-center">
  <div className="mb-6 text-primary">
    <MapPin className="h-12 w-12" />
  </div>
  <h2 className="text-xl font-semibold mb-2">Ative sua localizacao</h2>
  <p className="text-sm text-muted-foreground">
    Para receber entregas, precisamos saber onde voce esta
  </p>
  <Button className="mt-8 w-full" onClick={requestGPS}>
    Ativar localizacao
  </Button>
</div>
```

```tsx
// ❌ PROIBIDO — Texto longo no tutorial
<p className="text-sm">
  Para que voce possa receber entregas de forma eficiente, o aplicativo
  precisa ter acesso a sua localizacao em tempo real. Isso permite que
  os operadores vejam onde voce esta no mapa e possam atribuir entregas
  para o motoboy mais proximo...
</p>
```

### Overlay Guiado (Lojista)

| Aspecto | Padrao |
|---------|--------|
| Fundo | Overlay escuro (bg-black/60) com spotlight no elemento-alvo |
| Spotlight | Recorte transparente ao redor do elemento destacado |
| Tooltip | Card flutuante proximo ao elemento com seta apontando |
| Navegacao | Botao "Proximo" no tooltip. "Pular tour" discreto |
| Posicao | Tooltip automaticamente posicionado (top/bottom/left/right) conforme espaco |

```tsx
// ✅ OBRIGATORIO — Step do overlay
<div className="fixed inset-0 z-50">
  {/* Overlay com recorte */}
  <div className="absolute inset-0 bg-black/60" style={{ clipPath: spotlightClip }} />
  {/* Tooltip posicionado */}
  <div className="absolute bg-card rounded-lg p-4 shadow-lg max-w-xs" style={tooltipPosition}>
    <p className="text-sm font-medium">Digite o endereco de entrega</p>
    <p className="text-xs text-muted-foreground mt-1">
      Ou selecione um endereco favorito
    </p>
    <div className="flex justify-between mt-3">
      <Button variant="ghost" size="sm" onClick={onSkip}>Pular tour</Button>
      <Button size="sm" onClick={onNext}>Proximo</Button>
    </div>
  </div>
</div>
```

---

## Padroes de Help Contextual

### Tooltip de Ajuda

| Aspecto | Padrao |
|---------|--------|
| Icone | HelpCircle (lucide-react), 16px, text-muted-foreground |
| Posicao do icone | Inline, a direita do label do campo |
| Trigger | Hover (desktop) + tap (mobile) |
| Max largura | 240px |
| Max linhas | 2 linhas. Se precisar mais, link "Saiba mais" |
| Delay | 200ms para abrir, 0ms para fechar |

```tsx
// ✅ OBRIGATORIO — Tooltip de help
<div className="flex items-center gap-1.5">
  <Label htmlFor="closing_period">Periodo de fechamento</Label>
  <HelpTooltip
    content="Define de quanto em quanto tempo o sistema calcula os ganhos dos motoboys"
    learnMoreUrl="/docs/central#financeiro"
  />
</div>
```

```tsx
// ❌ PROIBIDO — Tooltip sem componente padrao
<span title="Define de quanto em quanto tempo...">?</span>
```

### Empty State Educativo

| Aspecto | Padrao |
|---------|--------|
| Layout | Centralizado vertical e horizontalmente |
| Icone | Icone contextual (lucide-react), 48px, text-muted-foreground/50 |
| Titulo | text-lg font-medium |
| Descricao | text-sm text-muted-foreground, max 2 linhas |
| CTA | Button variante default, opcional |
| Help link | Link discreto abaixo do CTA |

```tsx
// ✅ OBRIGATORIO — Empty state com CTA
<Empty
  icon={<Users className="h-12 w-12" />}
  title="Nenhum motoboy cadastrado"
  description="Convide seu primeiro motoboy para comecar a operar."
  actionLabel="Convidar motoboy"
  actionHref="/motoboys/novo"
  helpUrl="/docs/central#motoboys"
/>
```

```tsx
// ❌ PROIBIDO — Empty state generico sem contexto
<Empty
  icon={<Inbox className="h-12 w-12" />}
  title="Nenhum item encontrado"
  description="Nao ha dados para exibir."
/>
```

### Mensagens de Empty State por Contexto

| Pagina | Titulo | Descricao | CTA |
|--------|--------|-----------|-----|
| Pedidos (Central) | Nenhum pedido ainda | Seus lojistas podem criar pedidos pelo app ou voce pode criar manualmente. | Criar pedido |
| Motoboys (Central) | Nenhum motoboy cadastrado | Convide seu primeiro motoboy para comecar a operar. | Convidar motoboy |
| Lojas (Central) | Nenhuma loja cadastrada | Cadastre sua primeira loja para comecar a receber pedidos. | Cadastrar loja |
| Mapa (Central) | Nenhum motoboy online | Quando motoboys ficarem online, aparecerao aqui no mapa. | — |
| Entregas (Motoboy) | Nenhuma entrega ainda | Fique online para comecar a receber entregas. | Ficar online |
| Historico (Lojista) | Nenhuma entrega no historico | Crie seu primeiro pedido para comecar. | Criar pedido |

---

## Header Help Icon

| Aspecto | Padrao |
|---------|--------|
| Icone | HelpCircle, 20px |
| Posicao | Header da pagina, alinhado a direita |
| Comportamento | Click navega para /docs/{papel}#{secao} |
| Tooltip | "Ajuda" no hover |

```tsx
// ✅ OBRIGATORIO
<PageHelpLink url="/docs/central#mapa" />
```

---

## Tokens Especificos Wave 6

### Cores de Onboarding

| Token | Uso | Valor |
|-------|-----|-------|
| bg-black/50 | Overlay do wizard | Fundo semi-transparente |
| bg-black/60 | Overlay do guided tour | Fundo escuro com spotlight |
| bg-primary/5 | Fundo das telas do tutorial | Background suave |
| text-green-500 | Checkmark de step completo | Feedback positivo |

### Espacamento

| Contexto | Padrao |
|----------|--------|
| Icone do tutorial | mb-6 (24px abaixo do icone) |
| Titulo → descricao | mb-2 (8px) |
| Descricao → CTA | mt-8 (32px) |
| Tooltip padding | p-4 (16px) |

---

## Acessibilidade

- [ ] Wizard: focus trap dentro do modal. Esc fecha.
- [ ] Tutorial: slides navegaveis por keyboard (setas esquerda/direita)
- [ ] Overlay: elemento destacado recebe focus. aria-describedby no tooltip
- [ ] Tooltips: acessiveis por focus (Tab), nao apenas hover
- [ ] Empty states: CTA focavel. Descricao como aria-label do container
- [ ] Guias: headers com IDs para deep link. Skip nav disponivel
- [ ] Contrastes: todos os textos atendem WCAG AA (4.5:1 para texto normal)

---

## Rastreabilidade

| Padrao | Requisitos |
|--------|------------|
| Wizard | OSD001-OSD015, RNF001, RNF005 |
| Tutorial | OSD020-OSD031, RNF002, RNF005 |
| Overlay guiado | OSD040-OSD047 |
| Tooltip help | OSD080-OSD082, OSD088, RNF003, RNF006 |
| Empty state educativo | OSD083-OSD085 |
| Header help icon | OSD086, OSD087 |
