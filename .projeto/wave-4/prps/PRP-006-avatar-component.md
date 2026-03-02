---
status: current
wave: 4
session: wave-4--cc
---

# PRP-006 — Avatar Components (Frontend)

## Objetivo

Implementar os componentes de avatar com selecao de imagem, crop circular interativo, compressao automatica e upload para Supabase Storage. Inclui fallback visual com iniciais e cor deterministica.

## Execution Mode

`implementar`

## Contexto

O frontend usa React com Tailwind + shadcn/ui. Os apps Motoboy, Lojista e Central sao PWAs em `apps/motoboy/`, `apps/lojista/` e `apps/central/`. Componentes compartilhados podem ficar em `packages/shared/` mas atualmente esse package contem apenas schemas Zod (`packages/shared/schemas/`). Nao existe um package de UI compartilhado.

Os apps ja usam Supabase client para auth. O client Supabase no frontend esta configurado em cada app (ex: `apps/central/src/lib/supabase.ts` ou similar).

A spec chegala-avatar.md define tres componentes (AvatarDisplay, AvatarCropDialog, AvatarUpload) e utilitarios (getAvatarColor, getInitials, processImage). O hook useAvatarUpload gerencia o pipeline completo.

Os componentes shadcn usados no projeto incluem Dialog, Button, Slider. Os icones sao do Lucide React.

## Especificacao

### 1. Instalar dependencias

Nos apps que usarao avatar (central, motoboy, lojista), instalar:
- `react-easy-crop` ^5.1 — crop circular interativo
- `browser-image-compression` ^2.0 — compressao client-side
- `heic2any` ^0.0.4 — conversao HEIC para JPEG (fotos iOS)

Se o monorepo permite instalar no root para compartilhar, preferir essa abordagem.

### 2. Criar utilitarios em cada app (ou pasta compartilhada)

**`lib/avatar-color.ts`** conforme chegala-avatar.md secao 9:
- `getAvatarColor(name)` — retorna cor HSL deterministica baseada no hash do nome
- `getInitials(name)` — retorna ate 2 iniciais maiusculas

**`lib/image-pipeline.ts`** conforme chegala-avatar.md secao 9:
- `processImage(file)` — pipeline: HEIC detection/conversion → compressao (max 500KB, 512x512, WebP output)

### 3. Criar componente AvatarDisplay

Conforme chegala-avatar.md secao 4.1 e AVT001, AVT009, AVT010, OSD080, OSD088:
- Props: src, name, size (sm/md/lg/xl), editable, onEdit
- Se src presente: imagem circular
- Se src ausente: iniciais + cor de fundo deterministica (getAvatarColor)
- Se editable: overlay com icone Camera (Lucide) no hover/focus
- Tamanhos: sm=32px, md=40px, lg=64px, xl=128px

### 4. Criar componente AvatarCropDialog

Conforme chegala-avatar.md secao 4.2 e AVT004, AVT005, OSD084, OSD089:
- Props: open, image (data URL), onConfirm (croppedBlob), onCancel
- Usar react-easy-crop com `cropShape="round"` e `aspect={1}`
- Slider de zoom (1x a 3x) abaixo da area de crop
- Suporte a gestos touch (pinch-to-zoom, drag) e mouse (scroll zoom, drag)
- Dialog fullscreen em mobile (usar shadcn Dialog ou Sheet), modal em desktop
- Botoes "Cancelar" e "Confirmar" no footer
- Loading state no "Confirmar" durante processamento do canvas

Apos confirmar, extrair area cropada via canvas (getCroppedImg helper), converter para blob WebP.

### 5. Criar componente AvatarUpload (orquestrador)

Conforme chegala-avatar.md secao 4.3 e AVT002-AVT008, OSD081-OSD087:
- Props: currentAvatarUrl, userName, userId, onUploadComplete, size
- Combina AvatarDisplay (editable=true) + input hidden (accept="image/*") + AvatarCropDialog
- Pipeline ao selecionar imagem:
  1. Validar formato e tamanho (max 10MB pre-crop)
  2. Se HEIC/HEIF, converter via heic2any
  3. Abrir AvatarCropDialog com image URL
  4. Apos crop, comprimir via processImage
  5. Upload para Supabase Storage: `avatars/{userId}.webp` com upsert
  6. Obter URL publica
  7. Chamar onUploadComplete(url) para que o pai salve via PATCH /profiles/me

### 6. Criar hook useAvatarUpload (opcional)

Se a logica de upload ficar complexa, encapsular em hook conforme chegala-avatar.md secao 7:
- `isUploading`, `progress`, `error`, `upload(file)` retorna URL

## Limites

- NAO criar package `packages/shared/ui` — colocar componentes dentro de cada app que precisa (ou numa pasta local compartilhada como `src/components/avatar/`). Se duplicacao for problema, refatorar em wave futura
- NAO implementar a PerfilPage — isso e PRP-007. Este PRP cria apenas os componentes de avatar reutilizaveis
- NAO implementar endpoint de backend — este PRP e exclusivamente frontend. O upload vai direto para Supabase Storage via client JS
- NAO usar bibliotecas de crop que nao sejam react-easy-crop — e a escolha vinculante do design
- NAO comprimir acima de 500KB — seguir a spec: maxSizeMB 0.5, maxWidthOrHeight 512
