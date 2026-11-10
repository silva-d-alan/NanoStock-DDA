import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function UsuariosPage() {
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ nome: '', email: '', senha: '', perfil: 'ALMOXARIFE' });
  const [erro, setErro] = useState('');

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data } = await api.get('/usuarios');
      return data;
    },
  });

  const criarMutation = useMutation({
    mutationFn: (novoUsuario: any) => api.post('/usuarios', novoUsuario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      fecharModal();
    },
    onError: (error: any) => setErro(error.response?.data?.message || 'Erro ao cadastrar.'),
  });

  const editarMutation = useMutation({
    mutationFn: (dados: any) => api.patch(`/usuarios/${editandoId}`, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      fecharModal();
    },
    onError: (error: any) => setErro(error.response?.data?.message || 'Erro ao editar.'),
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/usuarios/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
    onError: (error: any) => alert(error.response?.data?.message || 'Erro ao excluir.'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editandoId) {
      editarMutation.mutate(form);
    } else {
      criarMutation.mutate(form);
    }
  }

  function abrirEdicao(usuario: any) {
    setEditandoId(usuario.id);
    setForm({ nome: usuario.nome, email: usuario.email, senha: '', perfil: usuario.perfil });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditandoId(null);
    setForm({ nome: '', email: '', senha: '', perfil: 'ALMOXARIFE' });
    setErro('');
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Gestão de Usuários</h1>
        <button onClick={() => setModalAberto(true)} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium">
          + Novo Usuário
        </button>
      </div>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-medium text-slate-600">Nome</th>
                <th className="p-4 font-medium text-slate-600">E-mail</th>
                <th className="p-4 font-medium text-slate-600">Perfil</th>
                <th className="p-4 font-medium text-slate-600 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios?.map((u: any) => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-medium">{u.nome}</td>
                  <td className="p-4 text-slate-500">{u.email}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">
                      {u.perfil}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => abrirEdicao(u)} className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-3">
                      Editar
                    </button>
                    <button onClick={() => { if(window.confirm('Excluir este usuário?')) excluirMutation.mutate(u.id) }} className="text-red-600 hover:text-red-800 font-medium text-sm">
                      Excluir
                    </button>
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
            <h2 className="text-xl font-bold mb-4">{editandoId ? 'Editar Usuário' : 'Cadastrar Usuário'}</h2>
            
            {erro && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{erro}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input required className="w-full border rounded-lg px-3 py-2" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">E-mail</label>
                <input type="email" required className="w-full border rounded-lg px-3 py-2" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Senha {editandoId && <span className="text-xs text-slate-400 font-normal">(Deixe em branco para não alterar)</span>}
                </label>
                <input type="password" required={!editandoId} className="w-full border rounded-lg px-3 py-2" value={form.senha} onChange={e => setForm({...form, senha: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Perfil de Acesso</label>
                <select className="w-full border rounded-lg px-3 py-2 bg-white" value={form.perfil} onChange={e => setForm({...form, perfil: e.target.value})}>
                  <option value="ALMOXARIFE">Almoxarife</option>
                  <option value="COMPRADOR">Comprador</option>
                  <option value="GESTOR">Gestor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
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