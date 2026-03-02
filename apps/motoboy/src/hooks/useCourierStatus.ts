import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { CourierStatus } from "@/components/ui/StatusBadge";

interface Courier {
  id: string;
  status: CourierStatus;
}

async function fetchMyCourier(): Promise<Courier | null> {
  try {
    return await api.get("api/couriers/me").json();
  } catch (err: unknown) {
    if (err instanceof Error && "response" in err) {
      const status = (err as { response: { status: number } }).response.status;
      if (status === 404) return null;
    }
    throw err;
  }
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

  const isCourier = user?.role === "courier";

  const courierQuery = useQuery({
    queryKey: ["courier", "me"],
    queryFn: fetchMyCourier,
    enabled: !!user && isCourier,
    refetchInterval: 30_000,
  });

  const courierId = courierQuery.data?.id ?? null;

  const statusMutation = useMutation({
    mutationFn: (newStatus: CourierStatus) => {
      if (!courierId) return Promise.resolve(null);
      return updateCourierStatus(courierId, newStatus);
    },
    onSuccess: (updatedCourier) => {
      if (updatedCourier) {
        queryClient.setQueryData(["courier", "me"], updatedCourier);
      }
    },
  });

  const status: CourierStatus = courierQuery.data?.status ?? "offline";

  const toggleStatus = () => {
    if (!courierId) return;
    const next: CourierStatus = status === "available" ? "offline" : "available";
    statusMutation.mutate(next);
  };

  return {
    courierId,
    status,
    isLoading: courierQuery.isLoading,
    isToggling: statusMutation.isPending,
    toggleStatus,
    setStatus: (s: CourierStatus) => {
      if (courierId) statusMutation.mutate(s);
    },
    error: statusMutation.error,
  };
}
