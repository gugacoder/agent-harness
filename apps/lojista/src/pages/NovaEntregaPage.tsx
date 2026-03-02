import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  User,
  Phone,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import { useShop } from "@/hooks/useShop";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHelpLink } from "@/components/ui/PageHelpLink";

const formSchema = z.object({
  pickup_address: z.string().min(1, "Endereço de coleta é obrigatório"),
  delivery_address: z.string().min(1, "Endereço de entrega é obrigatório"),
  recipient_name: z.string().min(1, "Nome do destinatário é obrigatório"),
  recipient_phone: z.string().min(1, "Telefone do destinatário é obrigatório"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function NovaEntregaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: shop, isLoading: shopLoading } = useShop();

  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, dirtyFields },
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      pickup_address: "",
      delivery_address: "",
      recipient_name: "",
      recipient_phone: "",
      notes: "",
    },
  });

  // Pre-fill pickup address when shop data loads (OSD101)
  useEffect(() => {
    if (shop?.address && !dirtyFields.pickup_address) {
      setValue("pickup_address", shop.address);
    }
  }, [shop, dirtyFields.pickup_address, setValue]);

  const onValidSubmit = () => {
    setShowConfirm(true);
  };

  const onConfirm = async () => {
    const data = getValues();
    setSubmitting(true);
    setError(null);
    try {
      await api
        .post("api/orders", {
          json: {
            pickup_address: data.pickup_address.trim(),
            pickup_lat: shop?.lat ?? "0",
            pickup_lng: shop?.lng ?? "0",
            delivery_address: data.delivery_address.trim(),
            delivery_lat: "0",
            delivery_lng: "0",
            recipient_name: data.recipient_name.trim(),
            recipient_phone: data.recipient_phone.trim(),
            notes: data.notes?.trim() || undefined,
          },
        })
        .json();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      navigate("/", { state: { toast: "Pedido criado com sucesso!" } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar pedido");
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (shopLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Nova Entrega</h1>
        <PageHelpLink url="/docs#criar-pedido" />
      </div>

      {error && (
        <div className="mt-3">
          <ErrorAlert message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit(onValidSubmit)} className="mt-4 space-y-4">
        {/* Endereço de coleta */}
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Endereço de coleta
          </label>
          <input
            type="text"
            {...register("pickup_address")}
            placeholder="Endereço do seu estabelecimento"
            className="w-full rounded-md border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {errors.pickup_address && (
            <p className="mt-1 text-xs text-destructive">
              {errors.pickup_address.message}
            </p>
          )}
        </div>

        {/* Endereço de entrega */}
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Endereço de entrega
          </label>
          <input
            type="text"
            {...register("delivery_address")}
            placeholder="Rua, número, bairro"
            className="w-full rounded-md border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {errors.delivery_address && (
            <p className="mt-1 text-xs text-destructive">
              {errors.delivery_address.message}
            </p>
          )}
        </div>

        {/* Nome do destinatário */}
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
            <User className="h-4 w-4 text-muted-foreground" />
            Nome do destinatário
          </label>
          <input
            type="text"
            {...register("recipient_name")}
            placeholder="Nome completo"
            className="w-full rounded-md border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {errors.recipient_name && (
            <p className="mt-1 text-xs text-destructive">
              {errors.recipient_name.message}
            </p>
          )}
        </div>

        {/* Telefone do destinatário */}
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Telefone do destinatário
          </label>
          <input
            type="tel"
            {...register("recipient_phone")}
            placeholder="(00) 00000-0000"
            className="w-full rounded-md border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {errors.recipient_phone && (
            <p className="mt-1 text-xs text-destructive">
              {errors.recipient_phone.message}
            </p>
          )}
        </div>

        {/* Observações */}
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Observações
            <span className="text-xs font-normal text-muted-foreground">
              (opcional)
            </span>
          </label>
          <textarea
            {...register("notes")}
            rows={3}
            placeholder="Instruções especiais, ponto de referência..."
            className="w-full resize-none rounded-md border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-medium text-white hover:bg-primary/90"
        >
          Confirmar Pedido
        </button>
      </form>

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={showConfirm}
        title="Confirmar Pedido"
        description={`Enviar pedido para ${getValues("delivery_address") || "o endereço informado"}?`}
        confirmLabel="Enviar Pedido"
        cancelLabel="Revisar"
        onConfirm={onConfirm}
        onCancel={() => setShowConfirm(false)}
        loading={submitting}
      />
    </div>
  );
}
