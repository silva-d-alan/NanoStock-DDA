import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function PastilhasPage() {
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState({ codigo: '', descricao: '', aplicacao: '', unidade: 'UN', estoqueMinimo: 0, fabricanteId: '' });

  // Busca as pastilhas
  const { data: pastilhas, isLoading, isError } = useQuery({
    queryKey: ['pastilhas'],
    queryFn: async () => {
      const { data } = await api.get('/pastilhas');
      return data;
    },
    retry: false, 
  });

  // Busca os fabricantes
  const { data: fabricantes } = useQuery({
    queryKey: ['fabricantes'],
    queryFn: async () => {
      const { data } = await api.get('/fabricantes');
      return data;
    },
    retry: false,
  });

  const criarMutation = useMutation({
    mutationFn: (novaPastilha: any) => api.post('/pastilhas', novaPastilha),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastilhas'] });
      setModalAberto(false);
      setForm({ codigo: '', descricao: '', aplicacao: '', unidade: 'UN', estoqueMinimo: 0, fabricanteId: '' });
    },
    onError: () => alert('Erro ao cadastrar. Verifique o backend.')
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    criarMutation.mutate({ ...form, estoqueMinimo: Number(form.estoqueMinimo) });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Catálogo de Pastilhas</h1>
        <button onClick={() => setModalAberto(true)} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium">
          + Nova Pastilha
        </button>
      </div>

      {/* MENSAGEM DE ERRO SE O BACKEND ESTIVER FORA */}
      {isError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p className="font-bold">Aviso: Falha na conexão com o servidor.</p>
          <p>Verifique se o terminal do Backend está rodando e se você está logado.</p>
        </div>
      )}

      {isLoading ? (
        <p>Carregando dados...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-medium text-slate-600">Código</th>
                <th className="p-4 font-medium text-slate-600">Descrição</th>
                <th className="p-4 font-medium text-slate-600">Fabricante</th>
                <th className="p-4 font-medium text-slate-600 text-center">Estoque Atual</th>
                <th className="p-4 font-medium text-slate-600 text-center">Estoque Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {pastilhas?.map((p: any) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-mono text-sm">{p.codigo}</td>
                  <td className="p-4 font-medium">{p.descricao}</td>
                  <td className="p-4 text-slate-500">{p.fabricante?.nome || 'Sem fabricante'}</td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${p.estoqueAtual <= p.estoqueMinimo ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {p.estoqueAtual}
                    </span>
                  </td>
                  <td className="p-4 text-center text-slate-500">{p.estoqueMinimo}</td>
                </tr>
              ))}
              {pastilhas?.length === 0 && !isError && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Nenhuma pastilha cadastrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Cadastrar Pastilha</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Código</label>
                <input required className="w-full border rounded-lg px-3 py-2" value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <input required className="w-full border rounded-lg px-3 py-2" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fabricante</label>
                <select required className="w-full border rounded-lg px-3 py-2" value={form.fabricanteId} onChange={e => setForm({...form, fabricanteId: e.target.value})}>
                  <option value="">Selecione...</option>
                  {fabricantes?.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Aplicação</label>
                  <input required className="w-full border rounded-lg px-3 py-2" value={form.aplicacao} onChange={e => setForm({...form, aplicacao: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estoque Mín.</label>
                  <input type="number" required min="0" className="w-full border rounded-lg px-3 py-2" value={form.estoqueMinimo} onChange={e => setForm({...form, estoqueMinimo: Number(e.target.value)})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setModalAberto(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={criarMutation.isPending} className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800">
                  {criarMutation.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}