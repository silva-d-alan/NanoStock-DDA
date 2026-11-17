import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { podeAcessar, usuarioLogado } from '../lib/permissoes';

/** RF12 – só renderiza a página se o perfil logado tiver acesso à rota */
export default function RotaProtegida({ rota, children }: { rota: string; children: ReactNode }) {
  if (!podeAcessar(usuarioLogado().perfil, rota)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
