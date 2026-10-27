import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { data: resumo, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard');
      return data;
    },
  });

  if (isLoading) {
    return <div className="p-8 text-slate-500">Carregando indicadores...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Visão Geral</h1>
        <p className="text-sm text-slate-500">Atualizado agora mesmo</p>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
          <p className="text-sm font-medium text-slate-500 mb-1">Total de Itens Cadastrados</p>
          <p className="text-3xl font-bold text-slate-800">{resumo?.totalPastilhas}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-500">
          <p className="text-sm font-medium text-slate-500 mb-1">Itens em Nível Crítico</p>
          <p className="text-3xl font-bold text-red-600">{resumo?.totalCriticos}</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl shadow-sm text-white">
          <p className="text-sm font-medium text-slate-300 mb-4">Ações Rápidas</p>
          <div className="flex gap-3">
            <Link to="/movimentacoes" className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Nova Movimentação
            </Link>
            <Link to="/pastilhas" className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Ver Estoque
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ALERTAS CRÍTICOS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-red-50 flex justify-between items-center">
            <h2 className="font-bold text-red-800">⚠️ Atenção Necessária</h2>
            <span className="text-xs font-bold bg-red-200 text-red-800 px-2 py-1 rounded-full">
              {resumo?.totalCriticos} alertas
            </span>
          </div>
          <div className="p-4">
            {resumo?.itensCriticos.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Nenhum item em nível crítico. Bom trabalho!</p>
            ) : (
              <ul className="space-y-3">
                {resumo?.itensCriticos.map((item: any) => (
                  <li key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-700">{item.descricao}</p>
                      <p className="text-xs text-slate-500 font-mono">{item.codigo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Atual / Mínimo</p>
                      <p className="font-bold text-red-600">{item.estoqueAtual} / {item.estoqueMinimo}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ÚLTIMAS MOVIMENTAÇÕES */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-slate-700">Últimas Movimentações</h2>
            <Link to="/movimentacoes" className="text-xs text-blue-600 hover:underline">Ver todas</Link>
          </div>
          <div className="p-4">
            {resumo?.movimentacoesRecentes.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Nenhuma movimentação recente.</p>
            ) : (
              <ul className="space-y-4">
                {resumo?.movimentacoesRecentes.map((mov: any) => (
                  <li key={mov.id} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${mov.tipo === 'ENTRADA' ? 'bg-green-500' : 'bg-orange-500'}`}>
                        {mov.tipo === 'ENTRADA' ? '↓' : '↑'}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-700">{mov.pastilha?.descricao}</p>
                        <p className="text-xs text-slate-500">{new Date(mov.data).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${mov.tipo === 'ENTRADA' ? 'text-green-600' : 'text-orange-600'}`}>
                        {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.quantidade}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}