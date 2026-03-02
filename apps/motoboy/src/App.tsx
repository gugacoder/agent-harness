import { BrowserRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ActiveDeliveryProvider } from "@/contexts/ActiveDeliveryContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { EntregasPage } from "@/pages/EntregasPage";
import { HistoricoPage } from "@/pages/HistoricoPage";
import { ExtratoPage } from "@/pages/ExtratoPage";
import { StatusPage } from "@/pages/StatusPage";
import { LoginPage } from "@/pages/LoginPage";
import { PerfilPage } from "@/pages/PerfilPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route
                element={
                  <ActiveDeliveryProvider>
                    <AppShell />
                  </ActiveDeliveryProvider>
                }
              >
                <Route index element={<EntregasPage />} />
                <Route path="historico" element={<HistoricoPage />} />
                <Route path="extrato" element={<ExtratoPage />} />
                <Route path="status" element={<StatusPage />} />
                <Route path="perfil" element={<PerfilPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
