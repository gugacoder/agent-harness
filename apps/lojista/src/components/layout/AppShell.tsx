import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { FileText, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyEventsContext } from "@/contexts/CompanyEventsContext";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function AppShell() {
  const { user, logout } = useAuth();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet = useMediaQuery("(min-width: 768px)");
  const location = useLocation();
  const navigate = useNavigate();
  const { invoiceToast, dismissInvoiceToast } = useCompanyEventsContext();

  const isOnFaturas = location.pathname.startsWith("/faturas");

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!invoiceToast || isOnFaturas) return;
    const timer = setTimeout(dismissInvoiceToast, 6000);
    return () => clearTimeout(timer);
  }, [invoiceToast, isOnFaturas, dismissInvoiceToast]);

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
        <Header userName={user?.fullName || user?.email || "Lojista"} userEmail={user?.email} onLogout={logout} />
        <main className="p-4 pb-20 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>

      {!isTablet && <BottomNav />}

      {/* Invoice toast — only shown when NOT on /faturas page */}
      {invoiceToast && !isOnFaturas && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 md:bottom-6">
          <button
            onClick={() => {
              dismissInvoiceToast();
              navigate("/faturas");
            }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
          >
            <FileText className="h-4 w-4" />
            {invoiceToast}
            <span
              role="button"
              aria-label="Fechar"
              onClick={(e) => {
                e.stopPropagation();
                dismissInvoiceToast();
              }}
              className="ml-1 rounded-full p-0.5 hover:bg-primary-foreground/20"
            >
              <X className="h-3 w-3" />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
