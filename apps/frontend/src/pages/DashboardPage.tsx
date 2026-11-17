import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import EstoqueResumo from '../components/EstoqueResumo';

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
        <div className="flex gap-3">
          <Link to="/movimentacoes" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Nova Movimentação
          </Link>
          <Link to="/pastilhas" className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Ver Estoque
          </Link>
        </div>
      </div>

      {/* RF10 / RN04 – indicadores e itens críticos, com os zerados em destaque */}
      <EstoqueResumo
        totalPastilhas={resumo?.totalPastilhas ?? 0}
        itensCriticos={resumo?.itensCriticos ?? []}
      />

      <div className="grid grid-cols-1 gap-6">
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
                        {mov.tipo === 'ENTRADA' ? '↓' : mov.tipo === 'SAIDA' ? '↑' : '±'}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-700">{mov.pastilha?.descricao}</p>
                        <p className="text-xs text-slate-500">{new Date(mov.data).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${mov.tipo === 'ENTRADA' ? 'text-green-600' : 'text-orange-600'}`}>
                        {mov.tipo === 'ENTRADA' ? '+' : mov.tipo === 'SAIDA' ? '-' : '±'}{mov.quantidade}
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