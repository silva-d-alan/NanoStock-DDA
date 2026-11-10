import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PastilhasPage from './pages/PastilhasPage';
import MovimentacoesPage from './pages/MovimentacoesPage';
import AlertasPage from './pages/AlertasPage';
import UsuariosPage from './pages/UsuariosPage'; // <-- APENAS UMA VEZ
import FabricantesPage from './pages/FabricantesPage';
import Layout from './components/Layout';


const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 30_000 } },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="pastilhas" element={<PastilhasPage />} />
            <Route path="fabricantes" element={<FabricantesPage />} />
            <Route path="movimentacoes" element={<MovimentacoesPage />} />
            <Route path="alertas" element={<AlertasPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
         
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}