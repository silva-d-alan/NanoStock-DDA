import { useState, type FormEvent } from 'react';
import { validarAjuste, type AjusteInput, type PastilhaResumo } from '../lib/estoque';

interface Props {
  pastilhas: PastilhaResumo[];
  onSubmit: (dados: AjusteInput) => void | Promise<void>;
  onCancel?: () => void;
  enviando?: boolean;
}

const campo = 'w-full border rounded-lg px-3 py-2';
const rotulo = 'block text-sm font-medium mb-1';

/** RF14 / RN05 – ajuste manual de inventário: quantidade contada + justificativa obrigatória */
export default function AjusteInventarioForm({ pastilhas, onSubmit, onCancel, enviando = false }: Props) {
  const [pastilhaId, setPastilhaId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [erros, setErros] = useState<string[]>([]);

  const pastilha = pastilhas.find((p) => p.id === pastilhaId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const contada = quantidade.trim() === '' ? NaN : Number(quantidade);
    const v = validarAjuste(contada, justificativa, pastilha);
    setErros(v);
    if (v.length === 0) {
      await onSubmit({ pastilhaId, quantidadeContada: contada, justificativa: justificativa.trim() });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Ajuste de inventário" className="space-y-4">
      <div>
        <label htmlFor="aj-item" className={rotulo}>Pastilha</label>
        <select id="aj-item" className={campo} value={pastilhaId} onChange={(e) => setPastilhaId(e.target.value)}>
          <option value="">Selecione...</option>
          {pastilhas.map((p) => (
            <option key={p.id} value={p.id}>{p.codigo} - {p.descricao}</option>
          ))}
        </select>
        {pastilha && (
          <p data-testid="saldo-sistema" className="text-sm text-slate-500 mt-1">
            Saldo no sistema: {pastilha.estoqueAtual}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="aj-qtd" className={rotulo}>Quantidade contada</label>
        <input
          id="aj-qtd"
          type="number"
          min={0}
          step={1}
          className={campo}
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="aj-just" className={rotulo}>Justificativa</label>
        <textarea
          id="aj-just"
          className={campo}
          rows={3}
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
          placeholder="Ex: contagem física mensal, 3 pastilhas quebradas"
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
          {enviando ? 'Salvando...' : 'Confirmar ajuste'}
        </button>
      </div>
    </form>
  );
}
