import { BrowserRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { PedidosPage } from "@/pages/PedidosPage";
import { NovaEntregaPage } from "@/pages/NovaEntregaPage";
import { HistoricoPage } from "@/pages/HistoricoPage";
import { LoginPage } from "@/pages/LoginPage";
import { FaturasPage } from "@/pages/faturas/FaturasPage";
import { EnderecosPage } from "@/pages/EnderecosPage";

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
              <Route element={<AppShell />}>
                <Route index element={<PedidosPage />} />
                <Route path="faturas" element={<FaturasPage />} />
                <Route path="nova" element={<NovaEntregaPage />} />
                <Route path="historico" element={<HistoricoPage />} />
                <Route path="enderecos" element={<EnderecosPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
