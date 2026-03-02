import { useState, useCallback } from "react";
import {
  MapPin,
  Star,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
  ArrowUpDown,
} from "lucide-react";
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useToggleFavorite,
} from "@/hooks/useAddresses";
import { AddressAutocomplete } from "@/components/address/AddressAutocomplete";
import { AddressPinDrop } from "@/components/address/AddressPinDrop";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import type { SavedAddress } from "@/types/api";

type SortOption = "most_used" | "recent" | "alpha";
type View = "list" | "new" | "preview";

const SORT_LABELS: Record<SortOption, string> = {
  most_used: "Mais usados",
  recent: "Recentes",
  alpha: "Alfabético",
};

export function EnderecosPage() {
  const [view, setView] = useState<View>("list");
  const [sort, setSort] = useState<SortOption>("most_used");
  const [sortOpen, setSortOpen] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SavedAddress | null>(null);
  const [previewAddress, setPreviewAddress] = useState<SavedAddress | null>(
    null,
  );

  // New address form state
  const [newAddress, setNewAddress] = useState("");
  const [newLat, setNewLat] = useState(0);
  const [newLng, setNewLng] = useState(0);
  const [newLabel, setNewLabel] = useState("");
  const [newComplement, setNewComplement] = useState("");
  const [newReference, setNewReference] = useState("");

  const { data: addresses, isLoading } = useAddresses({ sort });
  const { mutate: createAddress, isPending: isCreating } = useCreateAddress();
  const { mutate: updateAddress } = useUpdateAddress();
  const { mutate: deleteAddress, isPending: isDeleting } = useDeleteAddress();
  const { mutate: toggleFavorite } = useToggleFavorite();

  const resetNewForm = useCallback(() => {
    setNewAddress("");
    setNewLat(0);
    setNewLng(0);
    setNewLabel("");
    setNewComplement("");
    setNewReference("");
    setView("list");
  }, []);

  const handleCreate = useCallback(() => {
    if (!newAddress.trim()) return;
    createAddress(
      {
        address: newAddress,
        lat: String(newLat),
        lng: String(newLng),
        label: newLabel || undefined,
        complement: newComplement || undefined,
        reference: newReference || undefined,
      },
      { onSuccess: resetNewForm },
    );
  }, [
    newAddress,
    newLat,
    newLng,
    newLabel,
    newComplement,
    newReference,
    createAddress,
    resetNewForm,
  ]);

  const handleAutocompleteChange = useCallback(
    (data: { address: string; lat: number; lng: number }) => {
      setNewAddress(data.address);
      setNewLat(data.lat);
      setNewLng(data.lng);
    },
    [],
  );

  const handlePinDropChange = useCallback(
    (data: { lat: number; lng: number; address: string }) => {
      setNewLat(data.lat);
      setNewLng(data.lng);
      if (data.address) setNewAddress(data.address);
    },
    [],
  );

  const handleLabelEditStart = useCallback((addr: SavedAddress) => {
    setEditingLabelId(addr.id);
    setEditingLabelValue(addr.label ?? "");
  }, []);

  const handleLabelEditSave = useCallback(() => {
    if (!editingLabelId) return;
    updateAddress(
      { id: editingLabelId, label: editingLabelValue },
      {
        onSuccess: () => {
          setEditingLabelId(null);
          setEditingLabelValue("");
        },
      },
    );
  }, [editingLabelId, editingLabelValue, updateAddress]);

  const handleLabelEditCancel = useCallback(() => {
    setEditingLabelId(null);
    setEditingLabelValue("");
  }, []);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteAddress(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }, [deleteTarget, deleteAddress]);

  const handlePreview = useCallback((addr: SavedAddress) => {
    setPreviewAddress(addr);
    setView("preview");
  }, []);

  // --- Preview view ---
  if (view === "preview" && previewAddress) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setView("list");
              setPreviewAddress(null);
            }}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Voltar
          </button>
          <h1 className="text-lg font-semibold">
            {previewAddress.label || previewAddress.address}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {previewAddress.address}
        </p>
        {previewAddress.complement && (
          <p className="text-sm text-muted-foreground">
            Complemento: {previewAddress.complement}
          </p>
        )}
        {previewAddress.reference && (
          <p className="text-sm text-muted-foreground">
            Referência: {previewAddress.reference}
          </p>
        )}
        <AddressPinDrop
          lat={Number(previewAddress.lat)}
          lng={Number(previewAddress.lng)}
          onPositionChange={() => {}}
          height="300px"
        />
      </div>
    );
  }

  // --- New address form ---
  if (view === "new") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetNewForm}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Voltar
          </button>
          <h1 className="text-lg font-semibold">Novo Endereço</h1>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium">Endereço</label>
          <AddressAutocomplete
            value={newAddress}
            onChange={handleAutocompleteChange}
          />
        </div>

        <AddressPinDrop
          lat={newLat}
          lng={newLng}
          onPositionChange={handlePinDropChange}
          height="200px"
        />

        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium">Nome (opcional)</label>
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Ex: Casa, Trabalho, Filial Centro"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium">Complemento (opcional)</label>
          <input
            type="text"
            value={newComplement}
            onChange={(e) => setNewComplement(e.target.value)}
            placeholder="Ex: Apt 101, Bloco B"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium">Referência (opcional)</label>
          <input
            type="text"
            value={newReference}
            onChange={(e) => setNewReference(e.target.value)}
            placeholder="Ex: Próximo ao banco"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <button
          type="button"
          onClick={handleCreate}
          disabled={!newAddress.trim() || isCreating}
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar Endereço
        </button>
      </div>
    );
  }

  // --- List view ---
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Meus Endereços</h1>
        <button
          type="button"
          onClick={() => setView("new")}
          className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo Endereço
        </button>
      </div>

      {/* Sort dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setSortOpen(!sortOpen)}
          className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
        >
          <ArrowUpDown className="h-4 w-4" />
          {SORT_LABELS[sort]}
        </button>
        {sortOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 rounded-md border bg-popover shadow-md">
            {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSort(key);
                  setSortOpen(false);
                }}
                className={`block w-full px-4 py-2 text-left text-sm hover:bg-accent/10 ${sort === key ? "font-medium text-primary" : ""}`}
              >
                {SORT_LABELS[key]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!addresses || addresses.length === 0) && (
        <EmptyState
          icon={MapPin}
          title="Nenhum endereço salvo"
          description="Seus endereços frequentes aparecerão aqui"
        />
      )}

      {/* Address list */}
      {!isLoading &&
        addresses &&
        addresses.length > 0 &&
        addresses.map((addr) => (
          <div
            key={addr.id}
            className="flex items-start gap-3 rounded-lg border p-3"
          >
            {/* Favorite toggle */}
            <button
              type="button"
              onClick={() =>
                toggleFavorite({
                  id: addr.id,
                  is_favorite: !addr.is_favorite,
                })
              }
              className="mt-0.5 shrink-0"
              title={
                addr.is_favorite
                  ? "Remover dos favoritos"
                  : "Adicionar aos favoritos"
              }
            >
              <Star
                className={`h-5 w-5 ${addr.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground hover:text-yellow-400"}`}
              />
            </button>

            {/* Address info - clickable for preview */}
            <button
              type="button"
              onClick={() => handlePreview(addr)}
              className="flex flex-1 flex-col gap-1 text-left"
            >
              {/* Label (inline editable) */}
              {editingLabelId === addr.id ? (
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editingLabelValue}
                    onChange={(e) => setEditingLabelValue(e.target.value)}
                    className="rounded border border-input bg-background px-2 py-0.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLabelEditSave();
                      if (e.key === "Escape") handleLabelEditCancel();
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLabelEditSave();
                    }}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLabelEditCancel();
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {addr.label && (
                    <span className="text-sm font-medium">{addr.label}</span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLabelEditStart(addr);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                    title="Editar nome"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
              )}
              <span className="text-sm text-muted-foreground">
                {addr.address}
              </span>
              <span className="text-xs text-muted-foreground/70">
                Usado {addr.use_count} {addr.use_count === 1 ? "vez" : "vezes"}
              </span>
            </button>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => setDeleteTarget(addr)}
              className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive"
              title="Excluir endereço"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir endereço"
        description={`Tem certeza que deseja excluir "${deleteTarget?.label || deleteTarget?.address || ""}"?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={isDeleting}
      />
    </div>
  );
}
