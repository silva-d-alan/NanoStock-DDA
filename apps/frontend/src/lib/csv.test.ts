import { describe, expect, it } from 'vitest';
import { gerarCSV } from './csv';

describe('Exportação CSV (frontend)', () => {
  it('CT67 - RF13: gera CSV com cabeçalho e escape de ";", aspas e quebra de linha', () => {
    const csv = gerarCSV([
      { codigo: 'PST-001', descricao: 'Pastilha "A"; 80°', saldo: 4 },
      { codigo: 'PST-002', descricao: 'Linha 1\nLinha 2', saldo: null },
    ]);
    expect(csv).toBe('codigo;descricao;saldo\nPST-001;"Pastilha ""A""; 80°";4\nPST-002;"Linha 1\nLinha 2";');
    expect(gerarCSV([])).toBe('');
  });
});
