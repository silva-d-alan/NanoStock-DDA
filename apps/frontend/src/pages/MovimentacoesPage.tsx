import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function MovimentacoesPage() {
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState({ pastilhaId: '', tipo: 'ENTRADA', quantidade: 1, observacao: '' });

  // Histórico de movimentações
  const { data: movimentacoes, isLoading } = useQuery({
    queryKey: ['movimentacoes'],
    queryFn: async () => {
      const { data } = await api.get('/movimentacoes');
      return data;
    },
  });

  // Lista de pastilhas para o select
  const { data: pastilhas } = useQuery({
    queryKey: ['pastilhas'],
    queryFn: async () => {
      const { data } = await api.get('/pastilhas');
      return data;
    },
  });

  // Registrar movimentação
  const criarMutation = useMutation({
    mutationFn: (novaMov: any) => api.post('/movimentacoes', novaMov),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['pastilhas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas'] }); 
      setModalAberto(false);
      setForm({ pastilhaId: '', tipo: 'ENTRADA', quantidade: 1, observacao: '' });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao registrar movimentação.');
    }
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    criarMutation.mutate({ ...form, quantidade: Number(form.quantidade) });
  }

  // ==========================================
  // FUNÇÃO PARA EXPORTAR O RELATÓRIO CSV
  // ==========================================
  function exportarCSV() {
    if (!movimentacoes || movimentacoes.length === 0) {
      alert("Não há movimentações para exportar.");
      return;
    }

    // Cria o cabeçalho do CSV
    let csvContent = "Data,Tipo,Produto,Quantidade,Usuario,Observacao\n";

    // Preenche os dados
    movimentacoes.forEach((m: any) => {
      const data = new Date(m.data).toLocaleDateString('pt-BR');
      const obs = m.observacao ? m.observacao.replace(/,/g, ';') : '';
      csvContent += `${data},${m.tipo},${m.pastilha?.descricao},${m.quantidade},${m.usuario?.nome},${obs}\n`;
    });

    // Faz o download no navegador (Uint8Array ajuda o Excel a reconhecer os acentos)
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `relatorio_movimentacoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Movimentações de Estoque</h1>
        
        {/* BOTÕES NO TOPO DA TELA */}
        <div className="flex gap-3">
          <button 
            onClick={exportarCSV} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Exportar Relatório
          </button>
          <button 
            onClick={() => setModalAberto(true)} 
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            + Nova Movimentação
          </button>
        </div>
      </div>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-medium text-slate-600">Data</th>
                <th className="p-4 font-medium text-slate-600">Tipo</th>
                <th className="p-4 font-medium text-slate-600">Pastilha</th>
                <th className="p-4 font-medium text-slate-600 text-center">Qtd</th>
                <th className="p-4 font-medium text-slate-600">Usuário</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoes?.map((m: any) => (
                <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 text-sm text-slate-500">{new Date(m.data).toLocaleString('pt-BR')}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${m.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {m.tipo}
                    </span>
                  </td>
                  <td className="p-4 font-medium">{m.pastilha?.descricao}</td>
                  <td className="p-4 text-center font-bold">{m.quantidade}</td>
                  <td className="p-4 text-sm text-slate-500">{m.usuario?.nome}</td>
                </tr>
              ))}
              {movimentacoes?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Nenhuma movimentação registrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Movimentação */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Registrar Movimentação</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="ENTRADA" checked={form.tipo === 'ENTRADA'} onChange={() => setForm({...form, tipo: 'ENTRADA'})} />
                    Entrada
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="SAIDA" checked={form.tipo === 'SAIDA'} onChange={() => setForm({...form, tipo: 'SAIDA'})} />
                    Saída
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Pastilha</label>
                <select required className="w-full border rounded-lg px-3 py-2" value={form.pastilhaId} onChange={e => setForm({...form, pastilhaId: e.target.value})}>
                  <option value="">Selecione...</option>
                  {pastilhas?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.codigo} - {p.descricao} (Estoque: {p.estoqueAtual})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quantidade</label>
                <input type="number" required min="1" className="w-full border rounded-lg px-3 py-2" value={form.quantidade} onChange={e => setForm({...form, quantidade: Number(e.target.value)})} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Observação (Opcional)</label>
                <textarea className="w-full border rounded-lg px-3 py-2" rows={2} value={form.observacao} onChange={e => setForm({...form, observacao: e.target.value})} placeholder="Ex: NF 1234, Setor de Usinagem, etc." />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setModalAberto(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={criarMutation.isPending} className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800">
                  {criarMutation.isPending ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}