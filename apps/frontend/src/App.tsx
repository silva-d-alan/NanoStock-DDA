import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PastilhasPage from './pages/PastilhasPage';
import MovimentacoesPage from './pages/MovimentacoesPage';
import Layout from './components/Layout';
import AlertasPage from './pages/AlertasPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 30_000 } },
});

// Componente de proteção atualizado
function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // O 'replace' evita que a página de login fique no histórico ao ser redirecionado
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Rota Pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rotas Privadas com Layout */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            {/* O 'index' significa que esta é a rota padrão quando acessar "/" */}
            <Route index element={<DashboardPage />} />
            <Route path="pastilhas" element={<PastilhasPage />} />
            <Route path="movimentacoes" element={<MovimentacoesPage />} />
          </Route>
          
          {/* Rota de fallback: se digitar qualquer URL que não existe, volta pro Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}