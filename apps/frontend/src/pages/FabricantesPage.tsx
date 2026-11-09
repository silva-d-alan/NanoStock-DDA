import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Fabricante {
  id: string;
  nome: string;
  cnpj?: string;
  contato?: string;
}

const formVazio = { nome: '', cnpj: '', contato: '' };

export default function FabricantesPage() {
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(formVazio);

  const { data: fabricantes, isLoading, isError } = useQuery({
    queryKey: ['fabricantes'],
    queryFn: async () => {
      const { data } = await api.get('/fabricantes');
      return data as Fabricante[];
    },
    retry: false,
  });

  function aoConcluir() {
    queryClient.invalidateQueries({ queryKey: ['fabricantes'] });
    fecharModal();
  }

  const salvarMutation = useMutation({
    mutationFn: (dados: typeof formVazio) =>
      editandoId
        ? api.patch(`/fabricantes/${editandoId}`, dados)
        : api.post('/fabricantes', dados),
    onSuccess: aoConcluir,
    onError: () => alert('Erro ao salvar. Verifique se o backend está rodando.'),
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/fabricantes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fabricantes'] }),
    onError: () =>
      alert('Não foi possível excluir. O fabricante pode ter pastilhas vinculadas.'),
  });

  function abrirNovo() {
    setEditandoId(null);
    setForm(formVazio);
    setModalAberto(true);
  }

  function abrirEdicao(f: Fabricante) {
    setEditandoId(f.id);
    setForm({ nome: f.nome, cnpj: f.cnpj ?? '', contato: f.contato ?? '' });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditandoId(null);
    setForm(formVazio);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    salvarMutation.mutate(form);
  }

  function confirmarExclusao(f: Fabricante) {
    if (confirm(`Excluir o fabricante "${f.nome}"?`)) excluirMutation.mutate(f.id);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Fabricantes</h1>
        <button
          onClick={abrirNovo}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium"
        >
          + Novo Fabricante
        </button>
      </div>

      {isError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p className="font-bold">Aviso: falha na conexão com o servidor.</p>
          <p>Verifique se o backend está rodando e se você está logado.</p>
        </div>
      )}

      {isLoading ? (
        <p>Carregando dados...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-medium text-slate-600">Nome</th>
                <th className="p-4 font-medium text-slate-600">CNPJ</th>
                <th className="p-4 font-medium text-slate-600">Contato</th>
                <th className="p-4 font-medium text-slate-600 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {fabricantes?.map((f) => (
                <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">{f.nome}</td>
                  <td className="p-4 text-slate-500 font-mono text-sm">{f.cnpj || '—'}</td>
                  <td className="p-4 text-slate-500">{f.contato || '—'}</td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => abrirEdicao(f)}
                      className="text-blue-600 hover:underline text-sm font-medium mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => confirmarExclusao(f)}
                      className="text-red-600 hover:underline text-sm font-medium"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {fabricantes?.length === 0 && !isError && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Nenhum fabricante cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">
              {editandoId ? 'Editar Fabricante' : 'Cadastrar Fabricante'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  required
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CNPJ (opcional)</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contato (opcional)</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.contato}
                  onChange={(e) => setForm({ ...form, contato: e.target.value })}
                  placeholder="E-mail ou telefone"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvarMutation.isPending}
                  className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
                >
                  {salvarMutation.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}