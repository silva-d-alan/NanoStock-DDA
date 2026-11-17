import { describe, expect, it } from 'vitest';
import {
  calcularSaldo,
  filtrarPastilhas,
  statusEstoque,
  validarAjuste,
  validarMovimentacao,
  type PastilhaResumo,
} from './estoque';

const p = (over: Partial<PastilhaResumo> = {}): PastilhaResumo => ({
  id: 'p1',
  codigo: 'PST-001',
  descricao: 'Pastilha Cerâmica CNMG',
  estoqueAtual: 10,
  estoqueMinimo: 5,
  ...over,
});

describe('Regras de estoque (frontend)', () => {
  it('CT58 - RN01: bloqueia saída superior ao saldo disponível', () => {
    const erros = validarMovimentacao({ tipo: 'SAIDA', pastilhaId: 'p1', quantidade: 11, destino: 'PRODUCAO' }, p());
    expect(erros).toEqual(['Quantidade superior ao saldo disponível (10).']);
    // limite: saída igual ao saldo é permitida
    expect(validarMovimentacao({ tipo: 'SAIDA', pastilhaId: 'p1', quantidade: 10, destino: 'PRODUCAO' }, p())).toEqual([]);
  });

  it('CT59 - RN04: bloqueia saída de item com estoque zerado', () => {
    const erros = validarMovimentacao(
      { tipo: 'SAIDA', pastilhaId: 'p1', quantidade: 1, destino: 'PRODUCAO' },
      p({ estoqueAtual: 0 }),
    );
    expect(erros).toEqual(['Item com estoque zerado: saída bloqueada.']);
  });

  it('CT60 - RF04/RF05/RN09: exige item, quantidade inteira positiva, nota fiscal (entrada) e destino (saída)', () => {
    expect(validarMovimentacao({ tipo: 'ENTRADA', pastilhaId: '', quantidade: 0, notaFiscal: ' ' }, undefined)).toEqual([
      'Selecione um item.',
      'Quantidade deve ser um número inteiro maior que zero.',
      'Informe a nota fiscal da entrada.',
    ]);
    expect(validarMovimentacao({ tipo: 'SAIDA', pastilhaId: 'p1', quantidade: 1.5, destino: '' }, p())).toEqual([
      'Quantidade deve ser um número inteiro maior que zero.',
      'Informe o setor de destino.',
    ]);
    expect(validarMovimentacao({ tipo: 'ENTRADA', pastilhaId: 'p1', quantidade: 5, notaFiscal: 'NF-1' }, p())).toEqual([]);
  });

  it('CT61 - RN10: calcula o saldo após entrada e após saída', () => {
    expect(calcularSaldo(10, 'ENTRADA', 5)).toBe(15);
    expect(calcularSaldo(10, 'SAIDA', 4)).toBe(6);
    expect(calcularSaldo(10, 'SAIDA', 10)).toBe(0);
  });

  it('CT62 - RF03: filtra por código ou descrição, ignorando caixa e acentos', () => {
    const lista = [p(), p({ id: 'p2', codigo: 'TCMT-02', descricao: 'Inserto metal duro' })];
    expect(filtrarPastilhas(lista, 'pst').map((i) => i.id)).toEqual(['p1']);
    expect(filtrarPastilhas(lista, 'ceramica').map((i) => i.id)).toEqual(['p1']);
    expect(filtrarPastilhas(lista, 'METAL').map((i) => i.id)).toEqual(['p2']);
    expect(filtrarPastilhas(lista, '  ')).toHaveLength(2);
    expect(filtrarPastilhas(lista, 'inexistente')).toEqual([]);
  });

  it('CT63 - RF08/RN04: classifica o item como zerado, crítico ou normal', () => {
    expect(statusEstoque({ estoqueAtual: 0, estoqueMinimo: 5 })).toBe('ZERADO');
    expect(statusEstoque({ estoqueAtual: 5, estoqueMinimo: 5 })).toBe('CRITICO');
    expect(statusEstoque({ estoqueAtual: 6, estoqueMinimo: 5 })).toBe('OK');
  });

  it('CT64 - RF14/RN05: ajuste exige justificativa e quantidade contada válida', () => {
    expect(validarAjuste(8, 'quebra', p())).toEqual(['Justificativa obrigatória (mínimo de 10 caracteres).']);
    expect(validarAjuste(-1, 'Contagem física mensal', p())).toEqual([
      'Quantidade contada deve ser um número inteiro maior ou igual a zero.',
    ]);
    expect(validarAjuste(10, 'Contagem física mensal', p())).toEqual([
      'A quantidade contada é igual ao saldo do sistema; não há o que ajustar.',
    ]);
    expect(validarAjuste(8, 'Contagem física mensal', p())).toEqual([]);
  });
});
