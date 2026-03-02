import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import {
  ImpersonationProvider,
  useImpersonation,
} from "@/contexts/ImpersonationContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { AdminShell } from "@/components/layout/AdminShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { PedidosPage } from "@/pages/PedidosPage";
import { MotoboysPage } from "@/pages/MotoboysPage";
import { LojistasPage } from "@/pages/LojistasPage";
import { MapaPage } from "@/pages/MapaPage";
import { PrecosPage } from "@/pages/PrecosPage";
import { FinanceiroPage } from "@/pages/FinanceiroPage";
import { FaturasPage } from "@/pages/FaturasPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { ConfiguracaoPage } from "@/pages/ConfiguracaoPage";
import { PerfilPage } from "@/pages/PerfilPage";
import { UsuariosPage } from "@/pages/UsuariosPage";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { AdminEmpresasPage } from "@/pages/AdminEmpresasPage";
import { DocsPage } from "@/pages/DocsPage";
import { LoginPage } from "@/pages/LoginPage";
import { EnderecosPage } from "@/pages/enderecos/EnderecosPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function AppRoutes() {
  const { user } = useAuth();
  const { isImpersonating } = useImpersonation();
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        {/* Admin routes for super_admin (not impersonating) */}
        {isSuperAdmin && (
          <Route element={<AdminShell />}>
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/empresas" element={<AdminEmpresasPage />} />
            <Route path="admin/perfil" element={<PerfilPage />} />
          </Route>
        )}

        {/* Normal operator routes (or super_admin impersonating a company) */}
        <Route element={<AppShell />}>
          <Route index element={
            isSuperAdmin && !isImpersonating
              ? <Navigate to="/admin/dashboard" replace />
              : <DashboardPage />
          } />
          <Route path="pedidos" element={<PedidosPage />} />
          <Route path="motoboys" element={<MotoboysPage />} />
          <Route path="lojistas" element={<LojistasPage />} />
          <Route path="mapa" element={<MapaPage />} />
          <Route path="precos" element={<PrecosPage />} />
          <Route path="financeiro" element={<FinanceiroPage />} />
          <Route path="faturas" element={<FaturasPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="configuracao" element={<ConfiguracaoPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
          <Route path="perfil" element={<PerfilPage />} />
          <Route path="enderecos" element={<EnderecosPage />} />
          <Route path="docs" element={<DocsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ImpersonationProvider>
            <AppRoutes />
          </ImpersonationProvider>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
}
