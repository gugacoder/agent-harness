import { useState, useEffect } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { z } from "zod";
import { useUpdateShop } from "@/hooks/useShopDetail";
import { AddressAutocomplete } from "@/components/address/AddressAutocomplete";
import { AddressPinDrop } from "@/components/address/AddressPinDrop";
import type { ShopDetail } from "@/types/api";

interface ShopEditFormProps {
  shop: ShopDetail;
  open: boolean;
  onClose: () => void;
}

const editSchema = z.object({
  trade_name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  contact_name: z.string(),
  address: z.string().min(1, "Endereço é obrigatório"),
  lat: z.string(),
  lng: z.string(),
});

export function ShopEditForm({ shop, open, onClose }: ShopEditFormProps) {
  const updateShop = useUpdateShop();

  const [form, setForm] = useState({
    trade_name: shop.trade_name,
    phone: shop.phone,
    contact_name: shop.contact_name ?? "",
    address: shop.address,
    lat: shop.lat,
    lng: shop.lng,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        trade_name: shop.trade_name,
        phone: shop.phone,
        contact_name: shop.contact_name ?? "",
        address: shop.address,
        lat: shop.lat,
        lng: shop.lng,
      });
      setFieldErrors({});
      setError(null);
    }
  }, [open, shop]);

  if (!open) return null;

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAutocompleteChange = (data: {
    address: string;
    lat: number;
    lng: number;
  }) => {
    setForm((prev) => ({
      ...prev,
      address: data.address,
      lat: String(data.lat),
      lng: String(data.lng),
    }));
  };

  const handlePinDropChange = (data: {
    lat: number;
    lng: number;
    address: string;
  }) => {
    setForm((prev) => ({
      ...prev,
      lat: String(data.lat),
      lng: String(data.lng),
      ...(data.address ? { address: data.address } : {}),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = editSchema.safeParse(form);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errors[issue.path[0] as string] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setError(null);
    updateShop.mutate(
      {
        shopId: shop.id,
        data: {
          trade_name: form.trade_name,
          phone: form.phone,
          contact_name: form.contact_name || null,
          address: form.address,
          lat: form.lat,
          lng: form.lng,
        },
      },
      {
        onSuccess: () => onClose(),
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Erro ao salvar");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <div className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Editar Loja</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Nome Fantasia *
            </label>
            <input
              type="text"
              value={form.trade_name}
              onChange={(e) => updateField("trade_name", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {fieldErrors.trade_name && (
              <p className="mt-1 text-xs text-destructive">
                {fieldErrors.trade_name}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Telefone *
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-xs text-destructive">
                {fieldErrors.phone}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Nome do Contato
            </label>
            <input
              type="text"
              value={form.contact_name}
              onChange={(e) => updateField("contact_name", e.target.value)}
              placeholder="Nome do responsável"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Endereço *
            </label>
            <AddressAutocomplete
              value={form.address}
              onChange={handleAutocompleteChange}
              placeholder="Digite um endereço ou CEP..."
            />
            {fieldErrors.address && (
              <p className="mt-1 text-xs text-destructive">
                {fieldErrors.address}
              </p>
            )}
          </div>

          <AddressPinDrop
            lat={parseFloat(form.lat) || 0}
            lng={parseFloat(form.lng) || 0}
            onPositionChange={handlePinDropChange}
            height="200px"
          />

          <div className="flex justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateShop.isPending}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {updateShop.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
