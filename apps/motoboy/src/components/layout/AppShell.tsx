import { Outlet } from "react-router";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  return (
    <div className="mx-auto min-h-screen max-w-[480px] bg-background">
      <Header userName="Motoboy" status="offline" />
      <main className="p-4 pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
