import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function AlertasPage() {
  const queryClient = useQueryClient();

  // Busca os alertas ativos
  const { data: alertas, isLoading } = useQuery({
    queryKey: ['alertas'],
    queryFn: async () => {
      const { data } = await api.get('/alertas');
      return data;
    },
  });

  // Mutação para marcar como resolvido
  const resolverMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/alertas/${id}/resolver`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Alertas de Estoque</h1>
        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
          {alertas?.length || 0} pendentes
        </span>
      </div>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <div className="grid gap-4">
          {alertas?.map((alerta: any) => (
            <div key={alerta.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-red-500 border-y border-r border-slate-200 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800 text-lg">{alerta.pastilha?.descricao}</p>
                <p className="text-sm text-slate-500 mt-1">{alerta.mensagem}</p>
                <p className="text-xs text-slate-400 mt-2">Gerado em: {new Date(alerta.dataGeracao).toLocaleString('pt-BR')}</p>
              </div>
              <button 
                onClick={() => resolverMutation.mutate(alerta.id)}
                disabled={resolverMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Marcar como Resolvido
              </button>
            </div>
          ))}
          {alertas?.length === 0 && (
            <div className="text-center p-12 bg-white rounded-xl border border-slate-200">
              <p className="text-4xl mb-4">✅</p>
              <p className="text-lg font-medium text-slate-700">Tudo em ordem!</p>
              <p className="text-slate-500">Nenhum item abaixo do estoque mínimo no momento.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}