# Chega.la - Feature Spec: Avatar com Upload e Crop

Componente de avatar com selecao de imagem, crop circular interativo, compressao automatica e upload para Supabase Storage.

---

## 1. Objetivo

- Permitir que todos os usuarios adicionem foto de perfil
- Oferecer experiencia de crop circular moderna (padrao iFood/Loggi)
- Suportar multiplos formatos de imagem incluindo HEIC (iOS)
- Comprimir automaticamente para economia de banda e storage
- Exibir fallback visual elegante quando sem foto

---

## 2. Fluxo Principal

```
[Avatar atual ou placeholder]
    │
    ├─ Clique/tap
    │
    ▼
[Selecionar fonte]
    │
    ├─ Mobile: camera ou galeria (input accept="image/*" capture)
    ├─ Desktop: seletor de arquivos
    │
    ▼
[Pre-processamento]
    │
    ├─ HEIC/HEIF? → heic2any → JPEG
    ├─ Validar formato (JPEG, PNG, WebP, BMP, TIFF)
    ├─ Validar tamanho (max 10MB pre-crop)
    │
    ▼
[Crop Dialog]
    │
    ├─ react-easy-crop: area circular
    ├─ Zoom: slider + pinch (mobile) + scroll (desktop)
    ├─ Pan: drag
    ├─ Preview circular em tempo real
    ├─ Botoes: "Cancelar" | "Confirmar"
    │
    ▼
[Pos-processamento]
    │
    ├─ Canvas crop → toBlob("image/webp", 0.85)
    ├─ browser-image-compression: max 500KB, 512x512
    │
    ▼
[Upload]
    │
    ├─ supabase.storage.upload("avatars/{userId}.webp", blob, { upsert: true })
    ├─ Obter URL publica
    │
    ▼
[Salvar]
    │
    ├─ PATCH /api/profiles/me { avatar_url }
    ├─ Invalidar cache de imagem
    ├─ Atualizar UI (avatar em header + perfil)
```

---

## 3. Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| AVT001 | O sistema deve exibir avatar clicavel com overlay de camera icon no hover/focus |
| AVT002 | O sistema deve abrir seletor nativo de imagem (camera em mobile, arquivo em desktop) |
| AVT003 | O sistema deve converter HEIC/HEIF para JPEG antes do crop |
| AVT004 | O sistema deve exibir dialog de crop com area circular e controles de zoom |
| AVT005 | O sistema deve suportar gestos touch (pinch-to-zoom, drag) e mouse (scroll zoom, drag) |
| AVT006 | O sistema deve comprimir a imagem para WebP, max 500KB e 512x512px |
| AVT007 | O sistema deve fazer upload para Supabase Storage com upsert (substituir anterior) |
| AVT008 | O sistema deve atualizar avatar em toda a interface apos upload bem-sucedido |
| AVT009 | O sistema deve exibir fallback com iniciais do nome em circulo colorido quando sem avatar |
| AVT010 | O sistema deve gerar cor de fundo deterministica baseada no hash do nome |

---

## 4. Componentes

### 4.1 AvatarDisplay

**Localizacao:** `packages/shared/ui/src/avatar-display.tsx`

```typescript
interface AvatarDisplayProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  editable?: boolean;
  onEdit?: () => void;
}
```

**Comportamento:**
- Se `src` presente: exibe imagem circular
- Se `src` ausente: exibe iniciais (max 2 caracteres) + cor de fundo
- Se `editable`: overlay com icone de camera no hover
- Tamanhos: sm=32px, md=40px, lg=64px, xl=128px
- Cor de fundo: `hsl(hash(name) % 360, 60%, 45%)`

### 4.2 AvatarCropDialog

**Localizacao:** `packages/shared/ui/src/avatar-crop-dialog.tsx`

```typescript
interface AvatarCropDialogProps {
  open: boolean;
  image: string; // data URL ou object URL
  onConfirm: (croppedBlob: Blob) => void;
  onCancel: () => void;
}
```

**Comportamento:**
- Dialog fullscreen em mobile, modal centralizado em desktop
- react-easy-crop com `cropShape="round"` e `aspect={1}`
- Slider de zoom (1x a 3x) abaixo da area de crop
- Botoes "Cancelar" e "Confirmar" fixos no footer
- Loading state no "Confirmar" durante processamento

### 4.3 AvatarUpload (orquestrador)

**Localizacao:** `packages/shared/ui/src/avatar-upload.tsx`

```typescript
interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName: string;
  userId: string;
  onUploadComplete: (newUrl: string) => void;
  size?: "md" | "lg" | "xl";
}
```

**Comportamento:**
- Combina AvatarDisplay (editable) + input hidden + AvatarCropDialog
- Gerencia todo o pipeline: selecao → pre-processamento → crop → compressao → upload → callback

---

## 5. Banco de Dados

Nenhuma tabela nova. Usa campo existente `profiles.avatar_url`.

Storage: bucket `avatars` no Supabase Storage com politica:
- Upload: autenticado, path deve comecar com `{userId}/`
- Read: publico (avatar visivel para todos da empresa)
- Delete: autenticado, apenas o proprio usuario

---

## 6. Endpoint

**Localizacao:** `apps/backbone/src/routes/profiles.ts`

```typescript
// PATCH /api/profiles/me
// Input: { avatar_url?: string, full_name?: string, phone?: string, ... }
// Output: { profile: {...} }
export async function updateMyProfile(c: Context): Promise<Response>
```

---

## 7. Hook Frontend

**Localizacao:** `packages/shared/hooks/src/use-avatar-upload.ts`

```typescript
interface UseAvatarUploadReturn {
  isUploading: boolean;
  progress: number; // 0-100
  error: string | null;
  upload: (file: File) => Promise<string>; // retorna URL
  processAndCrop: (file: File) => Promise<Blob>; // pre-process + crop
}

export function useAvatarUpload(userId: string): UseAvatarUploadReturn
```

---

## 8. Integracao

```tsx
// apps/motoboy/src/pages/PerfilPage.tsx
import { AvatarUpload } from "@chegala/ui";
import { useProfile } from "../hooks/useProfile";

function PerfilPage() {
  const { profile, updateProfile } = useProfile();

  return (
    <AvatarUpload
      currentAvatarUrl={profile.avatar_url}
      userName={profile.full_name}
      userId={profile.id}
      onUploadComplete={(url) => updateProfile({ avatar_url: url })}
      size="xl"
    />
    {/* ... demais campos do perfil */}
  );
}
```

---

## 9. Utilidades

### Geracao de cor deterministica

```typescript
// packages/shared/ui/src/lib/avatar-color.ts
export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 45%)`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}
```

### Pipeline de compressao

```typescript
// packages/shared/ui/src/lib/image-pipeline.ts
import imageCompression from "browser-image-compression";
import heic2any from "heic2any";

export async function processImage(file: File): Promise<Blob> {
  let blob: Blob = file;

  // HEIC → JPEG
  if (file.type === "image/heic" || file.type === "image/heif") {
    blob = (await heic2any({ blob: file, toType: "image/jpeg" })) as Blob;
  }

  // Comprimir
  const compressed = await imageCompression(blob as File, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 512,
    fileType: "image/webp",
  });

  return compressed;
}
```

---

## 10. Rastreabilidade

| Componente | Requisitos OSD | Requisitos AVT |
|------------|----------------|----------------|
| AvatarDisplay | OSD080, OSD088 | AVT001, AVT009, AVT010 |
| AvatarCropDialog | OSD084, OSD089 | AVT004, AVT005 |
| AvatarUpload | OSD081-OSD087 | AVT002, AVT003, AVT006-AVT008 |
| processImage | OSD082-OSD085 | AVT003, AVT006 |
| getAvatarColor | OSD088 | AVT010 |
| useAvatarUpload | OSD086-OSD087 | AVT007 |

---

## 11. Metricas de Sucesso

| Metrica | Meta |
|---------|------|
| Taxa de usuarios com avatar | > 60% apos 30 dias de lancamento |
| Tempo medio selecao → upload concluido | < 15 segundos |
| Taxa de erro de upload | < 3% |
| Tamanho medio do avatar apos compressao | < 200KB |
| Satisfacao com crop (sem reclamacoes de qualidade) | > 95% |
