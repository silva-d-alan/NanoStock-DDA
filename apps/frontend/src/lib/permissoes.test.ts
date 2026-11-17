import { describe, expect, it } from 'vitest';
import { menusDoPerfil, podeAcessar } from './permissoes';

describe('Controle de acesso por perfil (frontend)', () => {
  it('CT65 - RF12: libera ou bloqueia rotas conforme o perfil', () => {
    expect(podeAcessar('ALMOXARIFE', '/movimentacoes')).toBe(true);
    expect(podeAcessar('COMPRADOR', '/movimentacoes')).toBe(false);
    expect(podeAcessar('GESTOR', '/pastilhas')).toBe(false);
    expect(podeAcessar('COMPRADOR', '/usuarios')).toBe(false);
    expect(podeAcessar('ADMIN', '/usuarios')).toBe(true);
    expect(podeAcessar(undefined, '/')).toBe(false);
    expect(podeAcessar('PERFIL_INVALIDO', '/')).toBe(false);
  });

  it('CT66 - RF12/RN03: menu de cada perfil; Almoxarife e Comprador enxergam os alertas', () => {
    const nomes = (perfil: string) => menusDoPerfil(perfil).map((m) => m.nome);
    expect(nomes('ALMOXARIFE')).toEqual(['Dashboard', 'Pastilhas', 'Fornecedores', 'Movimentações', 'Alertas', 'Relatórios']);
    expect(nomes('COMPRADOR')).toEqual(['Dashboard', 'Pastilhas', 'Fornecedores', 'Alertas', 'Relatórios']);
    expect(nomes('GESTOR')).toEqual(['Dashboard', 'Alertas', 'Relatórios']);
    expect(nomes('ADMIN')).toHaveLength(7);
  });
});
