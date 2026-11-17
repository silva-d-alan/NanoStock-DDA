import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AjusteInventarioForm from './AjusteInventarioForm';

const pastilhas = [{ id: 'p1', codigo: 'PST-001', descricao: 'CNMG', estoqueAtual: 50, estoqueMinimo: 5 }];

describe('AjusteInventarioForm', () => {
  it('CT74 - RF14/RN05: exige justificativa para o ajuste manual e envia quando informada', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<AjusteInventarioForm pastilhas={pastilhas} onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByLabelText('Pastilha'), 'p1');
    expect(screen.getByTestId('saldo-sistema')).toHaveTextContent('Saldo no sistema: 50');
    await user.type(screen.getByLabelText('Quantidade contada'), '47');
    await user.click(screen.getByRole('button', { name: 'Confirmar ajuste' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Justificativa obrigatória (mínimo de 10 caracteres).');
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Justificativa'), 'Inventário mensal: 3 quebradas');
    await user.click(screen.getByRole('button', { name: 'Confirmar ajuste' }));

    expect(onSubmit).toHaveBeenCalledWith({
      pastilhaId: 'p1',
      quantidadeContada: 47,
      justificativa: 'Inventário mensal: 3 quebradas',
    });
  });
});
