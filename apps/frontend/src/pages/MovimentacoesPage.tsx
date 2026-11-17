import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import MovimentacaoForm from '../components/MovimentacaoForm';
import AjusteInventarioForm from '../components/AjusteInventarioForm';
import { baixarCSV } from '../lib/csv';
import { detalheMovimentacao, type AjusteInput, type MovimentacaoInput } from '../lib/estoque';

const COR_TIPO: Record<string, string> = {
  ENTRADA: 'bg-green-100 text-green-700',
  SAIDA: 'bg-orange-100 text-orange-700',
  AJUSTE: 'bg-purple-100 text-purple-700',
};

export default function MovimentacoesPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<'movimentacao' | 'ajuste' | null>(null);

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

  function aoSalvar() {
    queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
    queryClient.invalidateQueries({ queryKey: ['pastilhas'] });
    queryClient.invalidateQueries({ queryKey: ['alertas'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    setModal(null);
  }

  function aoFalhar(error: any) {
    const msg = error.response?.data?.message;
    alert((Array.isArray(msg) ? msg.join('\n') : msg) || 'Erro ao registrar movimentação.');
  }

  // Registrar entrada/saída (RF04/RF05)
  const criarMutation = useMutation({
    mutationFn: (novaMov: MovimentacaoInput) => api.post('/movimentacoes', novaMov),
    onSuccess: aoSalvar,
    onError: aoFalhar,
  });

  // Ajuste manual de inventário (RF14)
  const ajusteMutation = useMutation({
    mutationFn: (ajuste: AjusteInput) => api.post('/movimentacoes/ajuste', ajuste),
    onSuccess: aoSalvar,
    onError: aoFalhar,
  });

  // RF13 – exportação do histórico em CSV
  function exportarCSV() {
    if (!movimentacoes || movimentacoes.length === 0) {
      alert('Não há movimentações para exportar.');
      return;
    }
    baixarCSV(
      `movimentacoes_${new Date().toISOString().split('T')[0]}.csv`,
      movimentacoes.map((m: any) => ({
        data: new Date(m.data).toLocaleString('pt-BR'),
        tipo: m.tipo,
        codigo: m.pastilha?.codigo ?? '',
        pastilha: m.pastilha?.descricao ?? '',
        quantidade: m.quantidade,
        saldoAnterior: m.saldoAnterior ?? '',
        saldoApos: m.saldoApos ?? '',
        notaFiscal: m.notaFiscal ?? '',
        destino: m.destino ?? '',
        justificativa: m.justificativa ?? '',
        usuario: m.usuario?.nome ?? '',
      })),
    );
  }

  // ==========================================
  // FUNÇÃO PARA EXPORTAR O RELATÓRIO PDF
  // ==========================================
    function exportarPDF() {
    if (!movimentacoes || movimentacoes.length === 0) {
      alert("Não há movimentações para exportar.");
      return;
    }

    // Cria um novo documento PDF (orientação paisagem 'l' para caber a tabela)
    const doc = new jsPDF('l', 'mm', 'a4');

    // Cabeçalho do PDF
    doc.setFontSize(18);
    doc.text("Relatório de Movimentações - NanoStock", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);

    // Prepara os dados da tabela
    const dadosTabela = movimentacoes.map((m: any) => [
      new Date(m.data).toLocaleDateString('pt-BR'),
      m.tipo,
      m.pastilha?.descricao || 'N/A',
      m.quantidade,
      m.saldoApos ?? '-',
      m.usuario?.nome || 'N/A',
      detalheMovimentacao(m)
    ]);

    // Desenha a tabela no PDF
    autoTable(doc, {
      startY: 35,
      head: [['Data', 'Tipo', 'Pastilha', 'Qtd', 'Saldo', 'Usuário', 'NF / Destino / Justificativa']],
      body: dadosTabela,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }, // Azul bonito
      styles: { fontSize: 9 }
    });

    // Faz o download
    doc.save(`relatorio_movimentacoes_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Movimentações de Estoque</h1>
        
        {/* BOTÕES NO TOPO DA TELA */}
        <div className="flex gap-3">
          <button 
            onClick={exportarPDF} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Exportar PDF
          </button>
          <button
            onClick={exportarCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Exportar CSV
          </button>
          <button
            onClick={() => setModal('ajuste')}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Ajuste de Inventário
          </button>
          <button 
            onClick={() => setModal('movimentacao')} 
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
                <th className="p-4 font-medium text-slate-600 text-center">Saldo</th>
                <th className="p-4 font-medium text-slate-600">NF / Destino / Justificativa</th>
                <th className="p-4 font-medium text-slate-600">Usuário</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoes?.map((m: any) => (
                <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 text-sm text-slate-500">{new Date(m.data).toLocaleString('pt-BR')}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${COR_TIPO[m.tipo] ?? ''}`}>
                      {m.tipo}
                    </span>
                  </td>
                  <td className="p-4 font-medium">{m.pastilha?.descricao}</td>
                  <td className="p-4 text-center font-bold">{m.quantidade}</td>
                  <td className="p-4 text-center text-sm text-slate-500">
                    {m.saldoApos != null ? `${m.saldoAnterior} → ${m.saldoApos}` : '-'}
                  </td>
                  <td className="p-4 text-sm text-slate-500">{detalheMovimentacao(m)}</td>
                  <td className="p-4 text-sm text-slate-500">{m.usuario?.nome}</td>
                </tr>
              ))}
              {movimentacoes?.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Nenhuma movimentação registrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-screen overflow-y-auto">
            {modal === 'movimentacao' ? (
              <>
                <h2 className="text-xl font-bold mb-4">Registrar Movimentação</h2>
                <MovimentacaoForm
                  pastilhas={pastilhas ?? []}
                  onSubmit={(dados) => criarMutation.mutate(dados)}
                  onCancel={() => setModal(null)}
                  enviando={criarMutation.isPending}
                />
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">Ajuste Manual de Inventário</h2>
                <AjusteInventarioForm
                  pastilhas={pastilhas ?? []}
                  onSubmit={(dados) => ajusteMutation.mutate(dados)}
                  onCancel={() => setModal(null)}
                  enviando={ajusteMutation.isPending}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}