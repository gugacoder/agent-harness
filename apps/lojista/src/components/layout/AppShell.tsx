import { Outlet } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function AppShell() {
  const { user, logout } = useAuth();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet = useMediaQuery("(min-width: 768px)");

  return (
    <div className="min-h-screen bg-background">
      {isTablet && <Sidebar collapsed={!isDesktop} />}

      <div
        className={
          isDesktop
            ? "ml-56"
            : isTablet
              ? "ml-16"
              : "mx-auto max-w-[480px]"
        }
      >
        <Header userName={user?.fullName || user?.email || "Lojista"} onLogout={logout} />
        <main className="p-4 pb-20 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>

      {!isTablet && <BottomNav />}
    </div>
  );
}
