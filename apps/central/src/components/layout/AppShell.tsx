import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useImpersonation } from "@/contexts/ImpersonationContext";

export function AppShell() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet = useMediaQuery("(min-width: 768px)");
  const { user, logout } = useAuth();
  const { data: profileData } = useProfile();
  const profile = profileData?.profile;
  const { isImpersonating, companyName, stopImpersonation } = useImpersonation();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar: fixed on desktop, collapsed on tablet, hidden on mobile */}
      {isTablet && <Sidebar collapsed={!isDesktop} />}

      {/* Main content area */}
      <div
        className={
          isDesktop
            ? "ml-56"
            : isTablet
              ? "ml-16"
              : ""
        }
      >
        <Header
          userName={profile?.full_name || user?.fullName || "Operador"}
          avatarUrl={profile?.avatar_url}
          onLogout={logout}
          impersonating={
            isImpersonating && companyName
              ? { companyName, onStop: stopImpersonation }
              : null
          }
        />
        <main className="p-4 pb-20 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* BottomNav: mobile only */}
      {!isTablet && <BottomNav />}
    </div>
  );
}
