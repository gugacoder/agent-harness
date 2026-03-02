import { useState, useEffect, useCallback } from "react";
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
import { useOnboarding } from "@/hooks/useOnboarding";
import { GuidedOverlay, type OverlayStep } from "@/components/onboarding/GuidedOverlay";
import { PostOrderModal } from "@/components/onboarding/PostOrderModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Skeleton } from "@/components/ui/Skeleton";
import { SavedAddressPicker } from "@/components/address/SavedAddressPicker";
import { AddressAutocomplete } from "@/components/address/AddressAutocomplete";
import { AddressPinDrop } from "@/components/address/AddressPinDrop";
import { CostEstimate } from "@/components/orders/CostEstimate";
import { PageHelpLink } from "@/components/ui/PageHelpLink";

const formSchema = z.object({
  pickup_address: z.string().min(1, "Endereço de coleta é obrigatório"),
  delivery_address: z.string().min(1, "Endereço de entrega é obrigatório"),
  delivery_lat: z.number(),
  delivery_lng: z.number(),
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

  const { shouldShowOnboarding, completeStep } = useOnboarding();
  const [showPostOrderModal, setShowPostOrderModal] = useState(false);

  const stepKeys = ["delivery_address", "recipient", "confirm_button"] as const;

  const overlaySteps: OverlayStep[] = [
    {
      targetSelector: "#delivery-address",
      title: "Endereço de entrega",
      description: "Digite o endereço de entrega ou selecione um favorito",
    },
    {
      targetSelector: "#recipient-fields",
      title: "Destinatário",
      description: "Informe o nome e telefone de quem vai receber",
    },
    {
      targetSelector: "#submit-button",
      title: "Confirmar",
      description: "Confirme e pronto! Um motoboy será atribuído em instantes.",
    },
  ];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, dirtyFields },
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      pickup_address: "",
      delivery_address: "",
      delivery_lat: 0,
      delivery_lng: 0,
      recipient_name: "",
      recipient_phone: "",
      notes: "",
    },
  });

  const deliveryAddress = watch("delivery_address");
  const deliveryLat = watch("delivery_lat");
  const deliveryLng = watch("delivery_lng");

  // Pre-fill pickup address when shop data loads (OSD101)
  useEffect(() => {
    if (shop?.address && !dirtyFields.pickup_address) {
      setValue("pickup_address", shop.address);
    }
  }, [shop, dirtyFields.pickup_address, setValue]);

  const handleSavedAddressSelect = useCallback(
    (data: {
      address: string;
      lat: number;
      lng: number;
      complement?: string;
      reference?: string;
    }) => {
      if (data.address) {
        setValue("delivery_address", data.address, { shouldValidate: true });
        setValue("delivery_lat", data.lat);
        setValue("delivery_lng", data.lng);
      }
    },
    [setValue],
  );

  const handleAutocompleteChange = useCallback(
    (data: { address: string; lat: number; lng: number }) => {
      setValue("delivery_address", data.address, { shouldValidate: true });
      setValue("delivery_lat", data.lat);
      setValue("delivery_lng", data.lng);
    },
    [setValue],
  );

  const handlePinDropChange = useCallback(
    (data: { lat: number; lng: number; address: string }) => {
      setValue("delivery_lat", data.lat);
      setValue("delivery_lng", data.lng);
      if (data.address) {
        setValue("delivery_address", data.address, { shouldValidate: true });
      }
    },
    [setValue],
  );

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
            delivery_lat: String(data.delivery_lat),
            delivery_lng: String(data.delivery_lng),
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

        {/* Endereço de entrega — SavedAddressPicker + Autocomplete + PinDrop */}
        <div id="delivery-address" className="space-y-2">
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Endereço de entrega
          </label>

          {/* Saved address picker above the address field */}
          <SavedAddressPicker onSelect={handleSavedAddressSelect} />

          {/* AddressAutocomplete replaces plain text input */}
          <AddressAutocomplete
            value={deliveryAddress}
            onChange={handleAutocompleteChange}
            placeholder="Rua, número, bairro ou CEP"
          />
          {errors.delivery_address && (
            <p className="mt-1 text-xs text-destructive">
              {errors.delivery_address.message}
            </p>
          )}

          {/* AddressPinDrop below autocomplete */}
          <AddressPinDrop
            lat={deliveryLat}
            lng={deliveryLng}
            onPositionChange={handlePinDropChange}
            height="200px"
          />

          {/* Cost estimate */}
          <CostEstimate
            pickupLat={shop?.lat ? Number(shop.lat) : 0}
            pickupLng={shop?.lng ? Number(shop.lng) : 0}
            deliveryLat={deliveryLat}
            deliveryLng={deliveryLng}
            enabled={!!shop?.lat && !!shop?.lng}
          />
        </div>

        {/* Destinatário (nome + telefone) */}
        <div id="recipient-fields" className="space-y-4">
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
          id="submit-button"
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

      {/* Onboarding overlay */}
      {shouldShowOnboarding && !showPostOrderModal && (
        <GuidedOverlay
          steps={overlaySteps}
          onStepChange={(i) => completeStep(stepKeys[i])}
          onComplete={() => setShowPostOrderModal(true)}
          onSkip={() => completeStep("completed")}
        />
      )}

      {/* Post-order modal (step 4 of onboarding) */}
      <PostOrderModal
        open={showPostOrderModal}
        onClose={() => {
          completeStep("post_order_flow");
          completeStep("completed");
          setShowPostOrderModal(false);
        }}
      />
    </div>
  );
}
