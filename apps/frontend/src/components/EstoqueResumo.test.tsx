import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import EstoqueResumo from './EstoqueResumo';

describe('EstoqueResumo (dashboard)', () => {
  it('CT75 - RF10/RN04: exibe os indicadores e destaca os itens zerados', () => {
    render(
      <EstoqueResumo
        totalPastilhas={12}
        itensCriticos={[
          { id: 'p2', codigo: 'PST-002', descricao: 'Inserto TCMT', estoqueAtual: 3, estoqueMinimo: 5 },
          { id: 'p1', codigo: 'PST-001', descricao: 'Pastilha CNMG', estoqueAtual: 0, estoqueMinimo: 5 },
        ]}
      />,
    );

    expect(screen.getByTestId('card-total')).toHaveTextContent('12');
    expect(screen.getByTestId('card-criticos')).toHaveTextContent('2');
    expect(screen.getByTestId('card-zerados')).toHaveTextContent('1');
    expect(screen.getByTestId('card-zerados')).toHaveClass('text-red-700');

    const itens = screen.getAllByRole('listitem');
    // o zerado vem primeiro e com o selo de bloqueio
    expect(itens[0]).toHaveAttribute('data-status', 'ZERADO');
    expect(itens[0]).toHaveTextContent('Pastilha CNMG');
    expect(itens[0]).toHaveTextContent('ZERADO – saída bloqueada');
    expect(itens[1]).toHaveAttribute('data-status', 'CRITICO');
    expect(itens[1]).not.toHaveTextContent('ZERADO');
  });
});
