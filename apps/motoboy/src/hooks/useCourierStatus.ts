import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { CourierStatus } from "@/components/ui/StatusBadge";

interface Courier {
  id: string;
  status: CourierStatus;
}

async function fetchCourier(courierId: string): Promise<Courier> {
  return api.get(`api/couriers/${courierId}`).json();
}

async function updateCourierStatus(
  courierId: string,
  status: CourierStatus,
): Promise<Courier> {
  return api
    .patch(`api/couriers/${courierId}/status`, { json: { status } })
    .json();
}

export function useCourierStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const courierId = user?.id ?? null;

  const courierQuery = useQuery({
    queryKey: ["courier", courierId],
    queryFn: () => fetchCourier(courierId!),
    enabled: !!courierId,
    refetchInterval: 30_000,
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: CourierStatus) =>
      updateCourierStatus(courierId!, newStatus),
    onSuccess: (updatedCourier) => {
      queryClient.setQueryData(["courier", courierId], updatedCourier);
    },
  });

  const status: CourierStatus = courierQuery.data?.status ?? "offline";

  const toggleStatus = () => {
    const next: CourierStatus = status === "available" ? "offline" : "available";
    statusMutation.mutate(next);
  };

  return {
    status,
    isLoading: courierQuery.isLoading,
    isToggling: statusMutation.isPending,
    toggleStatus,
    setStatus: (s: CourierStatus) => statusMutation.mutate(s),
    error: statusMutation.error,
  };
}
