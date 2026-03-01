import { BrowserRouter, Routes, Route } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { PedidosPage } from "@/pages/PedidosPage";
import { MotoboysPage } from "@/pages/MotoboysPage";
import { LojistasPage } from "@/pages/LojistasPage";
import { MapaPage } from "@/pages/MapaPage";
import { LoginPage } from "@/pages/LoginPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="pedidos" element={<PedidosPage />} />
          <Route path="motoboys" element={<MotoboysPage />} />
          <Route path="lojistas" element={<LojistasPage />} />
          <Route path="mapa" element={<MapaPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
