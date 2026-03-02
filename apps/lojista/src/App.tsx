import { BrowserRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { PedidosPage } from "@/pages/PedidosPage";
import { NovaEntregaPage } from "@/pages/NovaEntregaPage";
import { HistoricoPage } from "@/pages/HistoricoPage";
import { LoginPage } from "@/pages/LoginPage";
import { CadastroPage } from "@/pages/CadastroPage";
import { FaturasPage } from "@/pages/faturas/FaturasPage";
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
            <Route path="/cadastro" element={<CadastroPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route index element={<PedidosPage />} />
                <Route path="faturas" element={<FaturasPage />} />
                <Route path="nova" element={<NovaEntregaPage />} />
                <Route path="historico" element={<HistoricoPage />} />
                <Route path="perfil" element={<PerfilPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
