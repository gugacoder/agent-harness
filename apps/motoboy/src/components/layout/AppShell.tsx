import { Outlet } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useCourierStatus } from "@/hooks/useCourierStatus";
import { useActiveDelivery } from "@/hooks/useActiveDelivery";
import { useLocationSharing } from "@/hooks/useLocationSharing";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { LocationDeniedAlert } from "@/components/ui/LocationDeniedAlert";

export function AppShell() {
  const { user } = useAuth();
  const { status } = useCourierStatus();
  const { activeDelivery } = useActiveDelivery();
  const { state: locationState } = useLocationSharing({
    courierId: user?.id ?? null,
    status,
    hasActiveDelivery: !!activeDelivery,
  });

  return (
    <div className="mx-auto min-h-screen max-w-[480px] bg-background">
      <Header userName={user?.fullName || "Motoboy"} status={status} />
      <main className="p-4 pb-20">
        {locationState === "denied" && <LocationDeniedAlert />}
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
