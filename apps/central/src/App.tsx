import { BrowserRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
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

export function App() {
  return (
    <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route index element={<DashboardPage />} />
                <Route path="pedidos" element={<PedidosPage />} />
                <Route path="motoboys" element={<MotoboysPage />} />
                <Route path="lojistas" element={<LojistasPage />} />
                <Route path="mapa" element={<MapaPage />} />
                <Route path="precos" element={<PrecosPage />} />
                <Route path="financeiro" element={<FinanceiroPage />} />
                <Route path="faturas" element={<FaturasPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="enderecos" element={<EnderecosPage />} />
                <Route path="configuracao" element={<ConfiguracaoPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
}
