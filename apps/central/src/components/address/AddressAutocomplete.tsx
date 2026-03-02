import { useState, useRef, useCallback, useEffect } from "react";
import { Command } from "cmdk";
import { Search, MapPin, Building2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface AddressAutocompleteProps {
  value: string;
  onChange: (data: { address: string; lat: number; lng: number }) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface SearchResult {
  address: string;
  lat: number;
  lng: number;
  type: string;
}

interface CepResult {
  address: string;
  city: string;
  state: string;
  neighborhood: string;
  lat: number | null;
  lng: number | null;
}

const CEP_REGEX = /^\d{5}-?\d{3}$/;

function isCepQuery(query: string): boolean {
  const clean = query.replace(/\D/g, "");
  return clean.length === 8 && /^\d{8}$/.test(clean);
}

function normalizeCep(cep: string): string {
  return cep.replace(/\D/g, "");
}

const TYPE_ICONS: Record<string, typeof MapPin> = {
  house: MapPin,
  building: Building2,
};

function getTypeIcon(type: string) {
  return TYPE_ICONS[type] || MapPin;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-bold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Digite um endereço ou CEP...",
  disabled = false,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const searchAddress = useCallback(
    async (query: string) => {
      if (!query || query.trim().length < 3) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        if (isCepQuery(query)) {
          const cep = normalizeCep(query);
          const data = await api
            .get(`api/geocoding/cep/${cep}`)
            .json<CepResult>();
          const fullAddress = [
            data.address,
            data.neighborhood,
            data.city,
            data.state,
          ]
            .filter(Boolean)
            .join(", ");
          setResults([
            {
              address: fullAddress,
              lat: data.lat ?? 0,
              lng: data.lng ?? 0,
              type: "cep",
            },
          ]);
        } else {
          const data = await api
            .get("api/geocoding/search", { searchParams: { q: query } })
            .json<SearchResult[]>();
          setResults(data);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleInputChange = useCallback(
    (val: string) => {
      setInputValue(val);
      setOpen(true);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (val.trim().length < 3 && !isCepQuery(val)) {
        setResults([]);
        return;
      }

      debounceRef.current = setTimeout(() => {
        searchAddress(val);
      }, 300);
    },
    [searchAddress],
  );

  const handleSelect = useCallback(
    (address: string) => {
      const selected = results.find((r) => r.address === address);
      if (selected) {
        setInputValue(selected.address);
        setOpen(false);
        onChange({
          address: selected.address,
          lat: selected.lat,
          lng: selected.lng,
        });
      }
    },
    [results, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <Command
      shouldFilter={false}
      onKeyDown={handleKeyDown}
      className="relative"
    >
      <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Command.Input
          ref={inputRef}
          value={inputValue}
          onValueChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => setOpen(false), 200);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {loading && (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && (inputValue.trim().length >= 3 || isCepQuery(inputValue)) && (
        <Command.List className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {!loading && results.length === 0 && (
            <Command.Empty className="px-4 py-3 text-center text-sm text-muted-foreground">
              Nenhum endereço encontrado
            </Command.Empty>
          )}

          {results.map((result) => {
            const Icon = getTypeIcon(result.type);
            return (
              <Command.Item
                key={result.address}
                value={result.address}
                onSelect={handleSelect}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-accent/10 data-[selected=true]:bg-accent/10"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  {highlightMatch(result.address, inputValue)}
                </span>
              </Command.Item>
            );
          })}
        </Command.List>
      )}
    </Command>
  );
}
