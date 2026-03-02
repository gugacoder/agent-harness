import type {
  GeocodingCepResponse,
  GeocodingSearchResult,
  GeocodingReverseResponse,
} from "@chegala/schemas";

const USER_AGENT = "Chegala/1.0";

// ---------------------------------------------------------------------------
// searchByCep
// ---------------------------------------------------------------------------

export async function searchByCep(cep: string): Promise<GeocodingCepResponse> {
  const normalized = cep.replace(/\D/g, "");
  if (normalized.length !== 8) {
    throw new Error("CEP must be exactly 8 digits");
  }

  // Try ViaCEP first
  try {
    const res = await fetch(`https://viacep.com.br/ws/${normalized}/json/`);
    if (res.ok) {
      const data = await res.json();
      if (!data.erro) {
        return {
          address: data.logradouro || "",
          city: data.localidade || "",
          state: data.uf || "",
          neighborhood: data.bairro || "",
          lat: null,
          lng: null,
        };
      }
    }
  } catch {
    // fall through to BrasilAPI
  }

  // Fallback: BrasilAPI
  const res = await fetch(
    `https://brasilapi.com.br/api/cep/v2/${normalized}`
  );
  if (!res.ok) {
    throw new Error(`CEP not found: ${normalized}`);
  }
  const data = await res.json();
  return {
    address: data.street || "",
    city: data.city || "",
    state: data.state || "",
    neighborhood: data.neighborhood || "",
    lat: data.location?.coordinates?.latitude ?? null,
    lng: data.location?.coordinates?.longitude ?? null,
  };
}

// ---------------------------------------------------------------------------
// searchByText
// ---------------------------------------------------------------------------

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

interface HereItem {
  title: string;
  position: { lat: number; lng: number };
  resultType: string;
}

export async function searchByText(
  query: string
): Promise<GeocodingSearchResult[]> {
  // Try Nominatim first
  try {
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      countrycodes: "br",
      limit: "5",
    });
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { headers: { "User-Agent": USER_AGENT } }
    );
    if (res.ok && res.status !== 429) {
      const data: NominatimResult[] = await res.json();
      if (data.length > 0) {
        return data.map((r) => ({
          address: r.display_name,
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
          type: r.type,
        }));
      }
    }
  } catch {
    // fall through to HERE
  }

  // Fallback: HERE (if configured)
  const hereKey = process.env.HERE_API_KEY;
  if (!hereKey) return [];

  const params = new URLSearchParams({
    q: query,
    in: "countryCode:BRA",
    limit: "5",
    apiKey: hereKey,
  });
  const res = await fetch(
    `https://geocode.search.hereapi.com/v1/geocode?${params}`
  );
  if (!res.ok) return [];

  const data = await res.json();
  return (data.items as HereItem[]).map((item) => ({
    address: item.title,
    lat: item.position.lat,
    lng: item.position.lng,
    type: item.resultType || "address",
  }));
}

// ---------------------------------------------------------------------------
// reverseGeocode
// ---------------------------------------------------------------------------

interface NominatimReverseResult {
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    suburb?: string;
    neighbourhood?: string;
  };
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodingReverseResponse> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
  });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params}`,
    { headers: { "User-Agent": USER_AGENT } }
  );
  if (!res.ok) {
    throw new Error(`Reverse geocoding failed: HTTP ${res.status}`);
  }
  const data: NominatimReverseResult = await res.json();
  return {
    address: data.display_name,
    city: data.address.city || data.address.town || data.address.village || "",
    state: data.address.state || "",
    neighborhood: data.address.suburb || data.address.neighbourhood || "",
  };
}
