import { useEffect } from "react";
import { Outlet } from "react-router";
import { Wifi, WifiOff, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveDeliveryContext } from "@/contexts/ActiveDeliveryContext";
import { useCourierStatus } from "@/hooks/useCourierStatus";
import { useLocationSharing } from "@/hooks/useLocationSharing";
import { useCourierEvents } from "@/hooks/useCourierEvents";
import { useDeliveryNotification } from "@/components/notifications/DeliveryNotification";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { GpsBanner } from "@/components/status/GpsBanner";

export function AppShell() {
  const { user, logout } = useAuth();
  const { courierId, status } = useCourierStatus();
  const { activeDelivery } = useActiveDeliveryContext();
  const { connected, toast, dismissToast } = useCourierEvents(courierId);
  const { state: locationState } = useLocationSharing({
    courierId,
    status,
    hasActiveDelivery: !!activeDelivery,
  });
  useDeliveryNotification();

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismissToast, 4000);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  return (
    <div className="mx-auto min-h-screen max-w-[480px] bg-background">
      <Header userName={user?.fullName || "Motoboy"} userEmail={user?.email} status={status} onLogout={logout}>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {connected ? (
            <Wifi className="h-3.5 w-3.5 text-cs-success" />
          ) : (
            <WifiOff className="h-3.5 w-3.5" />
          )}
        </div>
      </Header>
      <GpsBanner state={locationState} />
      <main className="p-4 pb-20">
        {toast && (
          <div
            className={`mb-3 flex items-center justify-between rounded-md p-3 text-sm font-medium ${
              toast.variant === "success"
                ? "bg-cs-success/10 text-cs-success"
                : "bg-cs-warning/10 text-cs-warning"
            }`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={dismissToast}
              className="ml-2 shrink-0"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
