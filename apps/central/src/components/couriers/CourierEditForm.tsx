import { useState, useEffect } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { z } from "zod";
import { useUpdateCourier } from "@/hooks/useCourierDetail";
import type { CourierDetail } from "@/types/api";

interface CourierEditFormProps {
  courier: CourierDetail;
  open: boolean;
  onClose: () => void;
}

const editSchema = z.object({
  full_name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  vehicle_type: z.string(),
  plate_number: z.string(),
});

export function CourierEditForm({ courier, open, onClose }: CourierEditFormProps) {
  const updateCourier = useUpdateCourier();

  const [form, setForm] = useState({
    full_name: courier.full_name,
    phone: courier.phone,
    vehicle_type: courier.vehicle_type ?? "",
    plate_number: courier.plate_number ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        full_name: courier.full_name,
        phone: courier.phone,
        vehicle_type: courier.vehicle_type ?? "",
        plate_number: courier.plate_number ?? "",
      });
      setFieldErrors({});
      setError(null);
    }
  }, [open, courier]);

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
    updateCourier.mutate(
      {
        courierId: courier.id,
        data: {
          full_name: form.full_name,
          phone: form.phone,
          vehicle_type: form.vehicle_type || null,
          plate_number: form.plate_number || null,
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
          <h2 className="text-lg font-semibold">Editar Motoboy</h2>
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
            <label className="mb-1 block text-sm font-medium">Nome *</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {fieldErrors.full_name && (
              <p className="mt-1 text-xs text-destructive">
                {fieldErrors.full_name}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Telefone *</label>
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
            <label className="mb-1 block text-sm font-medium">Veículo</label>
            <select
              value={form.vehicle_type}
              onChange={(e) => updateField("vehicle_type", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Selecione...</option>
              <option value="moto">Moto</option>
              <option value="bicicleta">Bicicleta</option>
              <option value="carro">Carro</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Placa</label>
            <input
              type="text"
              value={form.plate_number}
              onChange={(e) => updateField("plate_number", e.target.value)}
              placeholder="ABC-1234"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

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
              disabled={updateCourier.isPending}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {updateCourier.isPending && (
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
