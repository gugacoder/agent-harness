import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DeliveryProof } from "@/types/delivery";

interface UploadProofParams {
  deliveryId: string;
  photo: Blob;
  signature: Blob;
  lat: string;
  lng: string;
  capturedAt: string;
}

async function uploadProof(params: UploadProofParams): Promise<DeliveryProof> {
  const formData = new FormData();
  formData.append("photo", params.photo, "photo.jpg");
  formData.append("signature", params.signature, "signature.png");
  formData.append("lat", params.lat);
  formData.append("lng", params.lng);
  formData.append("captured_at", params.capturedAt);

  return api
    .post(`api/deliveries/${params.deliveryId}/proof`, { body: formData })
    .json<DeliveryProof>();
}

export function usePodCapture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadProof,
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["delivery-proof", vars.deliveryId],
      });
    },
  });
}
