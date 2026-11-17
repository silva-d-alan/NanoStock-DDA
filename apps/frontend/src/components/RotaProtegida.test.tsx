import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RotaProtegida from './RotaProtegida';

function abrirUsuarios(perfil: string) {
  localStorage.setItem('usuario', JSON.stringify({ nome: 'Teste', perfil }));
  render(
    <MemoryRouter initialEntries={['/usuarios']}>
      <Routes>
        <Route path="/" element={<p>Dashboard</p>} />
        <Route path="/usuarios" element={<RotaProtegida rota="/usuarios"><p>Gestão de Usuários</p></RotaProtegida>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RotaProtegida', () => {
  afterEach(() => localStorage.clear());

  it('CT76 - RF12: perfil sem permissão é redirecionado para o dashboard', () => {
    abrirUsuarios('COMPRADOR');
    expect(screen.queryByText('Gestão de Usuários')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('CT77 - RF12: perfil ADMIN acessa a gestão de usuários', () => {
    abrirUsuarios('ADMIN');
    expect(screen.getByText('Gestão de Usuários')).toBeInTheDocument();
  });
});
