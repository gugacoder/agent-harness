import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { CourierStatus } from "@/components/ui/StatusBadge";

interface Courier {
  id: string;
  status: CourierStatus;
}

async function fetchMyCourier(): Promise<Courier> {
  return api.get("api/couriers/me").json();
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

  const courierQuery = useQuery({
    queryKey: ["courier", "me"],
    queryFn: fetchMyCourier,
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const courierId = courierQuery.data?.id ?? null;

  const statusMutation = useMutation({
    mutationFn: (newStatus: CourierStatus) =>
      updateCourierStatus(courierId!, newStatus),
    onSuccess: (updatedCourier) => {
      queryClient.setQueryData(["courier", "me"], updatedCourier);
    },
  });

  const status: CourierStatus = courierQuery.data?.status ?? "offline";

  const toggleStatus = () => {
    const next: CourierStatus = status === "available" ? "offline" : "available";
    statusMutation.mutate(next);
  };

  return {
    courierId,
    status,
    isLoading: courierQuery.isLoading,
    isToggling: statusMutation.isPending,
    toggleStatus,
    setStatus: (s: CourierStatus) => statusMutation.mutate(s),
    error: statusMutation.error,
  };
}
