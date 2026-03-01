import { Outlet } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  const { user } = useAuth();

  return (
    <div className="mx-auto min-h-screen max-w-[480px] bg-background">
      <Header userName={user?.fullName || "Motoboy"} status="offline" />
      <main className="p-4 pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
