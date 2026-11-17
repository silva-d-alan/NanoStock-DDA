import { useState, type FormEvent } from 'react';
import {
  calcularSaldo,
  DESTINOS,
  validarMovimentacao,
  type Destino,
  type MovimentacaoInput,
  type PastilhaResumo,
  type TipoMov,
} from '../lib/estoque';

interface Props {
  pastilhas: PastilhaResumo[];
  onSubmit: (dados: MovimentacaoInput) => void | Promise<void>;
  onCancel?: () => void;
  enviando?: boolean;
}

const campo = 'w-full border rounded-lg px-3 py-2';
const rotulo = 'block text-sm font-medium mb-1';

/** RF04 / RF05 – registro de entrada (com nota fiscal) ou saída (com destino) */
export default function MovimentacaoForm({ pastilhas, onSubmit, onCancel, enviando = false }: Props) {
  const [tipo, setTipo] = useState<TipoMov>('ENTRADA');
  const [pastilhaId, setPastilhaId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [notaFiscal, setNotaFiscal] = useState('');
  const [destino, setDestino] = useState<Destino | ''>('');
  const [observacao, setObservacao] = useState('');
  const [erros, setErros] = useState<string[]>([]);

  const pastilha = pastilhas.find((p) => p.id === pastilhaId);
  const zerado = pastilha?.estoqueAtual === 0;
  const qtd = Number(quantidade);
  const saldoPrevisto =
    pastilha && Number.isInteger(qtd) && qtd > 0 ? calcularSaldo(pastilha.estoqueAtual, tipo, qtd) : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const dados: MovimentacaoInput =
      tipo === 'ENTRADA'
        ? { tipo, pastilhaId, quantidade: qtd, notaFiscal: notaFiscal.trim() }
        : { tipo, pastilhaId, quantidade: qtd, destino };
    if (observacao.trim()) dados.observacao = observacao.trim();

    const v = validarMovimentacao(dados, pastilha);
    setErros(v);
    if (v.length === 0) await onSubmit(dados);
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Registrar movimentação" className="space-y-4">
      <fieldset>
        <legend className={rotulo}>Tipo</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="tipo" checked={tipo === 'ENTRADA'} onChange={() => setTipo('ENTRADA')} />
            Entrada
          </label>
          <label className={`flex items-center gap-2 ${zerado ? 'text-slate-400' : 'cursor-pointer'}`}>
            <input
              type="radio"
              name="tipo"
              checked={tipo === 'SAIDA'}
              disabled={zerado}
              onChange={() => setTipo('SAIDA')}
            />
            Saída
          </label>
        </div>
      </fieldset>

      <div>
        <label htmlFor="mov-item" className={rotulo}>Pastilha</label>
        <select id="mov-item" className={campo} value={pastilhaId} onChange={(e) => setPastilhaId(e.target.value)}>
          <option value="">Selecione...</option>
          {pastilhas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo} - {p.descricao} (Estoque: {p.estoqueAtual})
            </option>
          ))}
        </select>
        {zerado && (
          <p role="status" className="text-red-600 text-sm mt-1">
            Item com estoque zerado: saída bloqueada.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="mov-qtd" className={rotulo}>Quantidade</label>
        <input
          id="mov-qtd"
          type="number"
          min={1}
          step={1}
          className={campo}
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
        />
        {saldoPrevisto !== null && (
          <p data-testid="saldo-previsto" className="text-sm text-slate-500 mt-1">
            Saldo após a movimentação: {saldoPrevisto}
          </p>
        )}
      </div>

      {tipo === 'ENTRADA' ? (
        <div>
          <label htmlFor="mov-nf" className={rotulo}>Nota fiscal</label>
          <input
            id="mov-nf"
            className={campo}
            value={notaFiscal}
            onChange={(e) => setNotaFiscal(e.target.value)}
            placeholder="Ex: NF-12345"
          />
        </div>
      ) : (
        <div>
          <label htmlFor="mov-destino" className={rotulo}>Destino</label>
          <select
            id="mov-destino"
            className={campo}
            value={destino}
            onChange={(e) => setDestino(e.target.value as Destino | '')}
          >
            <option value="">Selecione...</option>
            {DESTINOS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="mov-obs" className={rotulo}>Observação (opcional)</label>
        <textarea
          id="mov-obs"
          className={campo}
          rows={2}
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />
      </div>

      {erros.length > 0 && (
        <ul role="alert" className="text-red-600 text-sm list-disc pl-5">
          {erros.map((erro) => <li key={erro}>{erro}</li>)}
        </ul>
      )}

      <div className="flex justify-end gap-3 mt-6">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            Cancelar
          </button>
        )}
        <button type="submit" disabled={enviando} className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800">
          {enviando ? 'Salvando...' : 'Confirmar'}
        </button>
      </div>
    </form>
  );
}
