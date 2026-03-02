---
status: current
---

# PRP-002 — Geocoding Service Backend

## Objetivo

Implementar servico de geocoding no backbone como proxy para ViaCEP, Nominatim e HERE, com 3 endpoints REST: busca por CEP, busca textual e geocoding reverso.

## Execution Mode

`implementar`

## Contexto

O backbone usa Hono.js (OpenAPIHono) com Zod validation. Rotas ficam em `apps/backbone/src/routes/`, servicos em `apps/backbone/src/services/`. Todas as rotas usam `authMiddleware` + `companyMiddleware`. O padrao de resposta e JSON direto (sem envelope wrapper). Servicos sao funcoes async exportadas (sem classes).

Atualmente nao existe nenhuma integracao de geocoding. O `NovaEntregaPage` no lojista envia `delivery_lat: "0"` e `delivery_lng: "0"` em todos os pedidos.

APIs externas a integrar:
- **ViaCEP**: `GET https://viacep.com.br/ws/{cep}/json/` — gratuito, sem auth
- **BrasilAPI**: `GET https://brasilapi.com.br/api/cep/v2/{cep}` — fallback para ViaCEP
- **Nominatim**: `GET https://nominatim.openstreetmap.org/search?q={query}&format=jsonv2&countrycodes=br&limit=5` — gratuito, 1 req/s, requer User-Agent
- **Nominatim reverse**: `GET https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=jsonv2`
- **HERE** (fallback): configuravel via env `HERE_API_KEY` — `GET https://geocode.search.hereapi.com/v1/geocode?q={query}&in=countryCode:BRA&apiKey={key}`

## Especificacao

### 1. Servico — `apps/backbone/src/services/geocoding.service.ts`

Funcoes:

**`searchByCep(cep: string)`**
- Normalizar CEP (remover hifen, validar 8 digitos)
- Tentar ViaCEP primeiro. Se `erro: true` no response, tentar BrasilAPI
- Retornar: `{ address, city, state, neighborhood, lat?, lng? }`
- ViaCEP nao retorna lat/lng — retornar null para esses campos

**`searchByText(query: string)`**
- Tentar Nominatim primeiro (header `User-Agent: Chegala/1.0`)
- Se falhar ou rate limited (429), tentar HERE se `HERE_API_KEY` configurado
- Retornar array: `[{ address, lat, lng, type }]` (max 5 resultados)
- Normalizar formato de ambos os providers para schema unico

**`reverseGeocode(lat: number, lng: number)`**
- Usar Nominatim reverse
- Retornar: `{ address, city, state, neighborhood }`

### 2. Rotas — `apps/backbone/src/routes/geocoding.ts`

Seguir padrao OpenAPIHono existente. Auth obrigatorio (authMiddleware + companyMiddleware).

| Metodo | Rota | Query/Params | Response |
|--------|------|-------------|----------|
| GET | /api/geocoding/cep/:cep | cep (path param, 8 digitos) | `{ address, city, state, neighborhood, lat, lng }` |
| GET | /api/geocoding/search | q (query string, min 3 chars) | `[{ address, lat, lng, type }]` |
| GET | /api/geocoding/reverse | lat, lng (query string, numeros) | `{ address, city, state, neighborhood }` |

Validacao Zod nos parametros de entrada. HTTP 400 para inputs invalidos. HTTP 502 para falhas nos provedores externos.

### 3. Schemas compartilhados

Criar `packages/shared/schemas/api/geocoding.ts` com:
- `GeocodingCepResponseSchema`
- `GeocodingSearchResultSchema` (array item)
- `GeocodingReverseResponseSchema`

Seguir padrao dos schemas existentes em `packages/shared/schemas/api/`.

### 4. Registro da rota

Registrar no app principal (arquivo que monta todas as rotas no Hono app) com prefixo `/api/geocoding`.

## Limites

- Nao instalar bibliotecas de geocoding — usar `fetch` nativo
- Nao implementar cache neste PRP (pode ser adicionado depois)
- Nao expor chaves de API no response
- Nao chamar Google Places API (custo proibitivo)
- HERE e opcional — funciona sem `HERE_API_KEY` (retorna array vazio como fallback)
- Nao alterar rotas existentes

## Exemplos

**Request:** `GET /api/geocoding/cep/01310100`
**Response:**
```json
{
  "address": "Avenida Paulista",
  "city": "São Paulo",
  "state": "SP",
  "neighborhood": "Bela Vista",
  "lat": null,
  "lng": null
}
```

**Request:** `GET /api/geocoding/search?q=Av Paulista 1000 SP`
**Response:**
```json
[
  { "address": "Avenida Paulista, 1000, Bela Vista, São Paulo, SP", "lat": -23.5631, "lng": -46.6544, "type": "street" },
  { "address": "Avenida Paulista, 1000, São Paulo, SP, Brasil", "lat": -23.5632, "lng": -46.6543, "type": "building" }
]
```
