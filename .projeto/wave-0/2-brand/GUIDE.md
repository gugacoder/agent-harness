# Guia de Branding

## O que e brand

Repositorio dos SVGs base da marca, organizados por tema (light/dark). Todos os assets visuais do app (icones PWA, favicons, splash screens, OG images) sao **derivados** destes SVGs — nunca criados do zero.

---

## Estrutura do diretorio

```
brand/
├── light/
│   ├── logo.svg                    # Icone isolado (1:1)
│   ├── logo+brand-horizontal.svg   # Icone + nome — landscape (~3:1)
│   ├── logo+brand-vertical.svg     # Icone + nome — portrait (~1.3:1)
│   ├── creative-horizontal.svg     # Composicao criativa — landscape (2:1)
│   └── creative-vertical.svg       # Composicao criativa — portrait (1:2)
└── dark/
    ├── logo.svg
    ├── logo+brand-horizontal.svg
    ├── logo+brand-vertical.svg
    ├── creative-horizontal.svg
    └── creative-vertical.svg
```

---

## Anatomia dos SVGs

### Propriedades comuns

- Todos sao **Inkscape SVGs** (inkscape:version 1.4.3)
- Sem margem — o conteudo ocupa 100% do viewBox
- Cada SVG contem um grupo `id="brand"` com o conteudo principal
- Cores da marca: `#d71f3b` (vermelho primario), `#ffffff` (branco), `#333333` (texto dark)

### Variacoes por tema

| Elemento | light/ | dark/ |
|----------|--------|-------|
| Circulo do logo | `#d71f3b` (vermelho) | `#d71f3b` (vermelho) |
| Icone interno | `#ffffff` (branco) | `#ffffff` (branco) |
| Texto da brand | `#333333` (cinza escuro) | `#ffffff` (branco) |
| Fundo creative | gradiente `#c090d0` → `#c5e5ff` (lavanda → azul claro) | gradiente `#553e5b` → `#27282c` (roxo escuro → carvao) |
| Watermark creative | `#ffffff` opacidade ~14% | `#ffffff` opacidade ~6% |

### Dimensoes dos SVGs

| Arquivo | Proporcao | Tamanho (pt) |
|---------|-----------|--------------|
| `logo.svg` | 1:1 | 322 x 322 |
| `logo+brand-horizontal.svg` | ~2.9:1 | 1024 x 352 |
| `logo+brand-vertical.svg` | ~1.3:1 | 712 x 558 |
| `creative-horizontal.svg` | 2:1 | 1024 x 512 |
| `creative-vertical.svg` | 1:2 | 512 x 1024 |

---

## Regras de derivacao

### Principio fundamental

> Os SVGs base nao tem margem. Toda imagem derivada deve **adicionar a margem ideal** para o perfeito posicionamento no contexto de destino.

### Processo

1. **Pesquisar o estado da arte** — antes de derivar, pesquisar os padroes de qualidade atuais para o formato alvo (tamanhos PWA, safe zones de icones, specs de splash screen, etc.)
2. **Selecionar o SVG correto** — escolher segundo o tema (light/dark) e o formato ideal para a finalidade
3. **Aplicar margem** — adicionar padding proporcional ao contexto (safe zone de icones, area segura de splash, etc.)
4. **Exportar no formato e resolucao necessarios** — PNG, WebP, ICO, conforme a finalidade

### Ferramenta recomendada

**Inkscape** (quando disponivel) para melhor fidelidade na conversao SVG → raster. Se Inkscape nao estiver instalado, baixar uma ferramenta apropriada para conversao de alta qualidade (ex: `sharp`, `resvg`, `librsvg`). Evitar conversoes de baixa fidelidade.

Exemplo com Inkscape CLI:
```bash
inkscape input.svg --export-type=png --export-width=512 --export-height=512 -o output.png
```

---

## Qual SVG usar para cada finalidade

### Icones PWA e favicon

**SVG base:** `logo.svg`

Selecionar tema conforme o contexto:
- `light/logo.svg` — para fundos claros ou quando o icone tera fundo proprio
- `dark/logo.svg` — identico ao light (o icone do logo nao muda entre temas)

| Finalidade | Tamanho | Margem recomendada | Formato |
|------------|---------|-------------------|---------|
| favicon.ico | 16x16, 32x32, 48x48 | ~10% de padding | ICO (multi-size) |
| apple-touch-icon | 180x180 | ~10% safe zone | PNG |
| PWA icon | 192x192 | ~10% safe zone | PNG |
| PWA icon | 512x512 | ~10% safe zone | PNG |
| PWA maskable icon | 512x512 | ~20% safe zone (obrigatorio) | PNG |
| shortcut icon | 96x96 | ~10% safe zone | PNG |

**Maskable icons:** a safe zone e um circulo inscrito que ocupa 80% do canvas. O conteudo deve caber nessa area. Aplicar ~20% de margem total.

### Splash screens

**SVG base:** `creative-horizontal.svg` ou `creative-vertical.svg`

Os creativos ja tem margem grande embutida que permite cropping seguro para ajustes de aspecto.

| Contexto | SVG | Tema |
|----------|-----|------|
| Splash landscape | `creative-horizontal.svg` | Selecionar conforme `prefers-color-scheme` |
| Splash portrait | `creative-vertical.svg` | Selecionar conforme `prefers-color-scheme` |
| Fundo claro | `light/creative-*.svg` | Gradiente lavanda → azul claro |
| Fundo escuro | `dark/creative-*.svg` | Gradiente roxo escuro → carvao |

Os creativos sao 2:1 (horizontal) e 1:2 (vertical) com ampla margem de seguranca — podem ser cortados (cropped) para outros aspect ratios sem perder o conteudo central.

### OG images e social sharing

**SVG base:** `creative-horizontal.svg` (OG padrao e 1200x630, proximo de 2:1)

| Finalidade | Tamanho | SVG |
|------------|---------|-----|
| og:image | 1200x630 | `light/creative-horizontal.svg` (crop do 2:1) |
| Twitter card | 1200x600 | `light/creative-horizontal.svg` (crop do 2:1) |

Preferir versao light para social sharing (melhor legibilidade em feeds claros e escuros).

### Branding em headers e footers

**SVG base:** `logo+brand-horizontal.svg` ou `logo+brand-vertical.svg`

| Contexto | SVG | Tema |
|----------|-----|------|
| Header / navbar | `logo+brand-horizontal.svg` | Conforme tema do app |
| Footer | `logo+brand-horizontal.svg` | Conforme tema do app |
| Login / onboarding | `logo+brand-vertical.svg` | Conforme tema do app |
| About / creditos | `logo+brand-vertical.svg` | Conforme tema do app |

Estes SVGs podem ser usados diretamente como `<img>` ou inline SVG — nao precisam de conversao raster exceto para contextos que exigem PNG.

### Areas de propaganda e marketing

**SVG base:** `creative-horizontal.svg` ou `creative-vertical.svg`

Os creativos contem:
- Gradiente de fundo tematico
- Watermark decorativo (marca d'agua translucida)
- Logo + brand name integrados no centro
- Margens amplas para cropping seguro

Ideais para: banners, hero sections, splash screens, backgrounds de propaganda, app store screenshots.

---

## Checklist de derivacao para PWA perfeito

Antes de derivar, pesquisar o estado da arte atual para:

- [ ] **Web App Manifest icons** — tamanhos obrigatorios e recomendados (192, 512, maskable)
- [ ] **Apple touch icon** — tamanho e safe zone atuais
- [ ] **Favicon** — formatos aceitos pelos browsers modernos (SVG inline, ICO multi-size, PNG)
- [ ] **Splash screens iOS** — tamanhos por dispositivo e `apple-touch-startup-image`
- [ ] **Maskable icon safe zone** — spec W3C atual (circulo inscrito 80%)
- [ ] **OG image** — tamanhos recomendados por plataforma (Facebook, Twitter/X, LinkedIn)
- [ ] **Theme color** — `#d71f3b` para meta tag e manifest
- [ ] **Background color** — conforme tema (light: fundo claro, dark: fundo escuro)

### Regra de selecao de tema

```
Se o asset e fixo (nao muda com tema do OS):
  → Usar light/ (maior legibilidade universal)

Se o asset respeita prefers-color-scheme:
  → light/ para tema claro
  → dark/ para tema escuro

Se o contexto e social sharing / OG:
  → Sempre light/ (feeds variam, light e mais seguro)
```

---

## Resumo rapido

| Precisa de... | Use | De onde |
|---------------|-----|---------|
| Icone quadrado | `logo.svg` + margem | light/ ou dark/ |
| Logo com nome (horizontal) | `logo+brand-horizontal.svg` | conforme tema |
| Logo com nome (vertical) | `logo+brand-vertical.svg` | conforme tema |
| Splash / banner landscape | `creative-horizontal.svg` | conforme tema |
| Splash / banner portrait | `creative-vertical.svg` | conforme tema |
| Social sharing | `creative-horizontal.svg` | light/ |
