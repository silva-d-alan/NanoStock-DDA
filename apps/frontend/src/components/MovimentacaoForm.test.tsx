import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MovimentacaoForm from './MovimentacaoForm';

const pastilhas = [
  { id: 'p1', codigo: 'PST-001', descricao: 'CNMG', estoqueAtual: 10, estoqueMinimo: 5 },
  { id: 'p2', codigo: 'PST-002', descricao: 'TCMT', estoqueAtual: 0, estoqueMinimo: 5 },
];

function montar() {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(<MovimentacaoForm pastilhas={pastilhas} onSubmit={onSubmit} />);
  return { onSubmit, user };
}

describe('MovimentacaoForm', () => {
  it('CT69 - RF04: entrada sem nota fiscal exibe erro e não envia', async () => {
    const { onSubmit, user } = montar();

    await user.selectOptions(screen.getByLabelText('Pastilha'), 'p1');
    await user.type(screen.getByLabelText('Quantidade'), '5');
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Informe a nota fiscal da entrada.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('CT70 - RF04/RN10: entrada válida envia item, quantidade e nota fiscal', async () => {
    const { onSubmit, user } = montar();

    await user.selectOptions(screen.getByLabelText('Pastilha'), 'p1');
    await user.type(screen.getByLabelText('Quantidade'), '20');
    await user.type(screen.getByLabelText('Nota fiscal'), 'NF-12345');

    expect(screen.getByTestId('saldo-previsto')).toHaveTextContent('Saldo após a movimentação: 30');
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onSubmit).toHaveBeenCalledWith({ tipo: 'ENTRADA', pastilhaId: 'p1', quantidade: 20, notaFiscal: 'NF-12345' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('CT71 - RN01: saída acima do saldo exibe erro e não envia', async () => {
    const { onSubmit, user } = montar();

    await user.selectOptions(screen.getByLabelText('Pastilha'), 'p1');
    await user.click(screen.getByLabelText('Saída'));
    await user.type(screen.getByLabelText('Quantidade'), '11');
    await user.selectOptions(screen.getByLabelText('Destino'), 'PRODUCAO');
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Quantidade superior ao saldo disponível (10).');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('CT72 - RF05/RN09/RN10: saída válida envia o destino e mostra o saldo previsto', async () => {
    const { onSubmit, user } = montar();

    await user.selectOptions(screen.getByLabelText('Pastilha'), 'p1');
    await user.click(screen.getByLabelText('Saída'));
    await user.type(screen.getByLabelText('Quantidade'), '4');

    // RN09 – sem destino a saída não é enviada
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o setor de destino.');
    expect(onSubmit).not.toHaveBeenCalled();

    await user.selectOptions(screen.getByLabelText('Destino'), 'MANUTENCAO');
    expect(screen.getByTestId('saldo-previsto')).toHaveTextContent('Saldo após a movimentação: 6');
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onSubmit).toHaveBeenCalledWith({ tipo: 'SAIDA', pastilhaId: 'p1', quantidade: 4, destino: 'MANUTENCAO' });
  });

  it('CT73 - RN04: item com estoque zerado desabilita a opção de saída', async () => {
    const { user } = montar();

    await user.selectOptions(screen.getByLabelText('Pastilha'), 'p2');

    expect(screen.getByLabelText('Saída')).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Item com estoque zerado: saída bloqueada.');
  });
});
