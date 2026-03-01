import { BrowserRouter, Routes, Route } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PedidosPage } from "@/pages/PedidosPage";
import { NovaEntregaPage } from "@/pages/NovaEntregaPage";
import { HistoricoPage } from "@/pages/HistoricoPage";
import { LoginPage } from "@/pages/LoginPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppShell />}>
          <Route index element={<PedidosPage />} />
          <Route path="nova" element={<NovaEntregaPage />} />
          <Route path="historico" element={<HistoricoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
