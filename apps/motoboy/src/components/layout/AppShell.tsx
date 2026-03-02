import { useEffect } from "react";
import { Outlet } from "react-router";
import { Wifi, WifiOff, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveDeliveryContext } from "@/contexts/ActiveDeliveryContext";
import { useCourierStatus } from "@/hooks/useCourierStatus";
import { useLocationSharing } from "@/hooks/useLocationSharing";
import { useCourierEvents } from "@/hooks/useCourierEvents";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { LocationDeniedAlert } from "@/components/ui/LocationDeniedAlert";
import { useProfile } from "@/hooks/useProfile";

export function AppShell() {
  const { user } = useAuth();
  const { data: profileData } = useProfile();
  const profile = profileData?.profile;
  const { courierId, status } = useCourierStatus();
  const { activeDelivery } = useActiveDeliveryContext();
  const { connected, toast, dismissToast } = useCourierEvents(courierId);
  const { state: locationState } = useLocationSharing({
    courierId,
    status,
    hasActiveDelivery: !!activeDelivery,
  });

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismissToast, 4000);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  return (
    <div className="mx-auto min-h-screen max-w-[480px] bg-background">
      <Header userName={profile?.full_name || user?.fullName || "Motoboy"} avatarUrl={profile?.avatar_url} status={status}>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {connected ? (
            <Wifi className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <WifiOff className="h-3.5 w-3.5" />
          )}
        </div>
      </Header>
      <main className="p-4 pb-20">
        {locationState === "denied" && <LocationDeniedAlert />}
        {toast && (
          <div
            className={`mb-3 flex items-center justify-between rounded-md p-3 text-sm font-medium ${
              toast.variant === "success"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-amber-50 text-amber-800"
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
