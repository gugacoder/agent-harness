---
status: current
---

# PRP-004 — Address Components Frontend

## Objetivo

Implementar componentes reutilizaveis de endereco (autocomplete, pin drop, saved picker) e integra-los no formulario de nova entrega do lojista, na Central e na tela "Meus Enderecos".

## Execution Mode

`implementar`

## Contexto

O lojista cria pedidos via `NovaEntregaPage.tsx` (~237 linhas) usando React Hook Form + Zod. Atualmente, `delivery_address` e campo de texto puro e `delivery_lat`/`delivery_lng` sao enviados como `"0"`. O mapa ja usa Leaflet (instalado, componente `MapView` existe na Central). O projeto usa shadcn/ui com tokens semanticos. A Central ja tem sidebar com navegacao. O lojista usa BottomNav mobile-first.

Os endpoints de geocoding (`/api/geocoding/*`) e saved addresses (`/api/saved-addresses`) ja existem no backend (PRP-002 e PRP-003).

A lib `cmdk` (Command Menu) sera usada para o autocomplete (decisao vinculante do design.md). `lodash.debounce` ja esta instalado.

## Especificacao

### 1. AddressAutocomplete — componente reutilizavel

**Arquivo:** `apps/central/src/components/address/AddressAutocomplete.tsx` (e copia/import no lojista)

**Props:**
```typescript
interface AddressAutocompleteProps {
  value: string
  onChange: (data: { address: string, lat: number, lng: number }) => void
  placeholder?: string
  disabled?: boolean
}
```

**Comportamento (OSD501-OSD512):**
- Campo de input com debounce 300ms
- Ao digitar:
  - Se parece CEP (8 digitos, com ou sem hifen): chamar `GET /api/geocoding/cep/{cep}`
  - Se texto (>= 3 chars): chamar `GET /api/geocoding/search?q={query}`
- Dropdown com sugestoes (usar cmdk Command para acessibilidade):
  - Icone de tipo ao lado de cada sugestao (OSD509)
  - Texto digitado em negrito nas sugestoes (OSD508)
  - Spinner durante loading (OSD510)
  - Mensagem empty state se sem resultados (OSD511)
- Navegacao por teclado: setas, Enter, Esc (OSD512)
- Ao selecionar: chamar `onChange` com address + lat + lng
- Se CEP retorna sem lat/lng: preencher apenas texto, lat/lng ficam pendentes ate busca textual ou pin drop

### 2. AddressPinDrop — mapa com pin arrastavel

**Arquivo:** `apps/central/src/components/address/AddressPinDrop.tsx` (e copia/import no lojista)

**Props:**
```typescript
interface AddressPinDropProps {
  lat: number
  lng: number
  onPositionChange: (data: { lat: number, lng: number, address: string }) => void
  height?: string
}
```

**Comportamento (OSD505-OSD507):**
- Mapa Leaflet com marcador arrastavel (marcador azul #1dace7)
- Texto instrucional: "Arraste o pin para ajustar a localizacao"
- Ao soltar pin: chamar `GET /api/geocoding/reverse?lat=X&lng=Y` (debounce 500ms)
- Callback `onPositionChange` com novas coordenadas + endereco resolvido
- Zoom nivel 17 quando lat/lng sao definidos
- Se lat/lng iniciais = 0: centralizar no Brasil (-15.77, -47.92) com zoom 4

### 3. SavedAddressPicker — dropdown de enderecos salvos

**Arquivo:** `apps/central/src/components/address/SavedAddressPicker.tsx` (e copia/import no lojista)

**Props:**
```typescript
interface SavedAddressPickerProps {
  onSelect: (data: { address: string, lat: number, lng: number, complement?: string, reference?: string }) => void
}
```

**Comportamento (OSD534-OSD538):**
- Buscar enderecos via `GET /api/saved-addresses`
- Exibir como dropdown/select acima do campo de endereco
- Ordenacao: favoritos (estrela) primeiro, depois por frequencia
- Badge de uso: "Usado N vezes"
- Busca textual nos enderecos (campo de filtro no dropdown)
- Opcao "Digitar novo endereco" no final
- Ao selecionar: chamar `onSelect` com todos os dados

### 4. Integracao no NovaEntregaPage (lojista)

Modificar `apps/lojista/src/pages/NovaEntregaPage.tsx`:
- Acima do campo `delivery_address`: adicionar `SavedAddressPicker`
- Substituir input de texto por `AddressAutocomplete`
- Abaixo do autocomplete: adicionar `AddressPinDrop` (mapa menor, ~200px)
- Form schema: garantir que `delivery_lat` e `delivery_lng` sao numeros reais (nao "0")
- Ao selecionar endereco (via autocomplete, pin drop ou saved): preencher todos os campos do form
- Adicionar `CostEstimate` abaixo do mapa (este componente sera detalhado no PRP-009, por agora reservar espaco no layout)

### 5. Integracao na Central

Em formularios de edicao de loja (PRP-005 criara a tela): disponibilizar `AddressAutocomplete` + `AddressPinDrop` como componentes importaveis.

### 6. Tela "Meus Enderecos" (lojista + Central)

**Lojista:** `apps/lojista/src/pages/EnderecosPage.tsx` (nova pagina)
**Central:** `apps/central/src/pages/enderecos/EnderecosPage.tsx` (nova pagina)

**Comportamento (OSD540-OSD545):**
- Lista de enderecos salvos com: label, endereco, badge favorito (estrela), contagem de uso
- Botao "Novo Endereco": formulario com AddressAutocomplete + AddressPinDrop + campos label, complemento, referencia
- Inline edit de label
- Toggle favorito (estrela)
- Excluir com confirmacao (dialog)
- Ordenacao: mais usados, recentes, alfabetico (dropdown de sort)
- Preview no mapa ao clicar num endereco (AddressPinDrop read-only)

**Navegacao:**
- Lojista: adicionar item "Meus Enderecos" no BottomNav (icone MapPin, rota `/enderecos`)
- Central: adicionar item "Enderecos" na sidebar (icone MapPin, rota `/enderecos`)

### 7. Hook — useAddresses

Criar `apps/lojista/src/hooks/useAddresses.ts` (e equivalente na Central):
- `useAddresses()`: lista enderecos com react-query
- Mutations: create, update, delete, toggle favorite
- Invalidacao de cache apos mutacoes

## Limites

- Nao instalar Google Places ou Mapbox
- Nao alterar `MapView` existente na Central (criar componente separado para pin drop)
- Nao alterar rotas do backbone (ja implementadas nos PRP-002 e PRP-003)
- Nao implementar CRUD de lojas/motoboys neste PRP (feito nos PRP-005/006)
- Manter compatibilidade com formulario existente de nova entrega — nao remover campos, apenas enriquecer

## Exemplos

**Fluxo de selecao de endereco no NovaEntregaPage:**
```
1. Lojista abre "Nova Entrega"
2. Ve dropdown "Selecionar endereco salvo" com favoritos e recentes
3. Seleciona "⭐ Filial Centro — Av. Paulista, 1000"
4. Campos preenchidos: endereco, lat, lng, complemento
5. Mapa centraliza no ponto
6. Lojista pode ajustar arrastando o pin
7. Ao confirmar, pedido enviado com coordenadas reais
```
