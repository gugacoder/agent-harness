import { Outlet } from "react-router";
import { AdminSidebar } from "./AdminSidebar";
import { Header } from "./Header";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

export function AdminShell() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet = useMediaQuery("(min-width: 768px)");
  const { user, logout } = useAuth();
  const { data: profileData } = useProfile();
  const profile = profileData?.profile;

  return (
    <div className="min-h-screen bg-background">
      {isTablet && <AdminSidebar collapsed={!isDesktop} />}

      <div
        className={
          isDesktop ? "ml-56" : isTablet ? "ml-16" : ""
        }
      >
        <Header
          userName={profile?.full_name || user?.fullName || "Super Admin"}
          avatarUrl={profile?.avatar_url}
          onLogout={logout}
        />
        <main className="p-4 pb-20 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
