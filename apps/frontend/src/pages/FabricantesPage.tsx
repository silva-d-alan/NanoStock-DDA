import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function FabricantesPage() {
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: '', cnpj: '', contato: '' });

  const { data: fabricantes, isLoading } = useQuery({
    queryKey: ['fabricantes'],
    queryFn: async () => {
      const { data } = await api.get('/fabricantes');
      return data;
    },
  });

  const criarMutation = useMutation({
    mutationFn: (novo: any) => api.post('/fabricantes', novo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fabricantes'] });
      fecharModal();
    },
  });

  const editarMutation = useMutation({
    mutationFn: (dados: any) => api.patch(`/fabricantes/${editandoId}`, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fabricantes'] });
      fecharModal();
    },
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/fabricantes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fabricantes'] }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editandoId) editarMutation.mutate(form);
    else criarMutation.mutate(form);
  }

  function abrirEdicao(f: any) {
    setEditandoId(f.id);
    setForm({ nome: f.nome, cnpj: f.cnpj || '', contato: f.contato || '' });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditandoId(null);
    setForm({ nome: '', cnpj: '', contato: '' });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Cadastro de Fornecedores</h1>
        <button onClick={() => setModalAberto(true)} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium">
          + Novo Fornecedor
        </button>
      </div>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-medium text-slate-600">Nome do Fornecedor</th>
                <th className="p-4 font-medium text-slate-600">CNPJ</th>
                <th className="p-4 font-medium text-slate-600">Contato</th>
                <th className="p-4 font-medium text-slate-600 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {fabricantes?.map((f: any) => (
                <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-medium">{f.nome}</td>
                  <td className="p-4 text-slate-500">{f.cnpj || '-'}</td>
                  <td className="p-4 text-slate-500">{f.contato || '-'}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => abrirEdicao(f)} className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-3">Editar</button>
                    <button onClick={() => { if(window.confirm('Excluir este fornecedor?')) excluirMutation.mutate(f.id) }} className="text-red-600 hover:text-red-800 font-medium text-sm">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">{editandoId ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Fornecedor</label>
                <input required className="w-full border rounded-lg px-3 py-2" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CNPJ</label>
                <input className="w-full border rounded-lg px-3 py-2" value={form.cnpj} onChange={e => setForm({...form, cnpj: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contato</label>
                <input className="w-full border rounded-lg px-3 py-2" value={form.contato} onChange={e => setForm({...form, contato: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={fecharModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={criarMutation.isPending || editarMutation.isPending} className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800">
                  {criarMutation.isPending || editarMutation.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}