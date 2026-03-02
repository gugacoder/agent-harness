import { useState, useMemo, useRef, useEffect } from "react";
import { Star, MapPin, ChevronDown, Search, Loader2, PenLine } from "lucide-react";
import { useAddresses } from "@/hooks/useAddresses";

interface SavedAddressPickerProps {
  onSelect: (data: {
    address: string;
    lat: number;
    lng: number;
    complement?: string;
    reference?: string;
  }) => void;
}

export function SavedAddressPicker({ onSelect }: SavedAddressPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: addresses, isLoading } = useAddresses();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Sort: favorites first, then by use_count descending
  const sorted = useMemo(() => {
    if (!addresses) return [];
    const filtered = search
      ? addresses.filter(
          (a) =>
            a.address.toLowerCase().includes(search.toLowerCase()) ||
            (a.label && a.label.toLowerCase().includes(search.toLowerCase())),
        )
      : addresses;
    return [...filtered].sort((a, b) => {
      if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
      return b.use_count - a.use_count;
    });
  }, [addresses, search]);

  function handleSelect(addr: (typeof sorted)[0]) {
    onSelect({
      address: addr.address,
      lat: parseFloat(addr.lat),
      lng: parseFloat(addr.lng),
      complement: addr.complement ?? undefined,
      reference: addr.reference ?? undefined,
    });
    setOpen(false);
    setSearch("");
  }

  function handleNewAddress() {
    setOpen(false);
    setSearch("");
    // Signal to parent that user wants to type a new address
    // by calling onSelect with empty data — parent should show autocomplete
    onSelect({ address: "", lat: 0, lng: 0 });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent/5"
      >
        <span className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Selecionar endereço salvo
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {/* Search filter */}
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar endereço..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          {/* Address list */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && sorted.length === 0 && (
              <div className="px-4 py-3 text-center text-sm text-muted-foreground">
                Nenhum endereço salvo
              </div>
            )}

            {sorted.map((addr) => (
              <button
                key={addr.id}
                type="button"
                onClick={() => handleSelect(addr)}
                className="flex w-full items-start gap-3 px-3 py-2 text-left text-sm hover:bg-accent/10"
              >
                {addr.is_favorite ? (
                  <Star className="mt-0.5 h-4 w-4 shrink-0 fill-yellow-400 text-yellow-400" />
                ) : (
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  {addr.label && (
                    <div className="font-medium">{addr.label}</div>
                  )}
                  <div className="truncate text-muted-foreground">
                    {addr.address}
                  </div>
                  {addr.use_count > 0 && (
                    <span className="mt-0.5 inline-block rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      Usado {addr.use_count} {addr.use_count === 1 ? "vez" : "vezes"}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* New address option */}
          <div className="border-t">
            <button
              type="button"
              onClick={handleNewAddress}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-accent/10"
            >
              <PenLine className="h-4 w-4" />
              Digitar novo endereço
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
