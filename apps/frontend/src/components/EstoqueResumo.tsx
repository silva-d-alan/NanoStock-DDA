import { statusEstoque, type PastilhaResumo } from '../lib/estoque';

interface Props {
  totalPastilhas: number;
  itensCriticos: PastilhaResumo[];
}

/** RF10 / RN04 – indicadores do estoque, com os itens zerados em destaque */
export default function EstoqueResumo({ totalPastilhas, itensCriticos }: Props) {
  const zerados = itensCriticos.filter((p) => statusEstoque(p) === 'ZERADO');
  // zerados primeiro, para chamarem a atenção
  const ordenados = [...zerados, ...itensCriticos.filter((p) => statusEstoque(p) !== 'ZERADO')];

  return (
    <section aria-label="Situação do estoque" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
          <p className="text-sm font-medium text-slate-500 mb-1">Total de Itens Cadastrados</p>
          <p data-testid="card-total" className="text-3xl font-bold text-slate-800">{totalPastilhas}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-orange-500">
          <p className="text-sm font-medium text-slate-500 mb-1">Itens em Nível Crítico</p>
          <p data-testid="card-criticos" className="text-3xl font-bold text-orange-600">{itensCriticos.length}</p>
        </div>
        <div
          className={`p-6 rounded-xl shadow-sm border border-l-4 ${
            zerados.length > 0 ? 'bg-red-50 border-red-200 border-l-red-600' : 'bg-white border-slate-200 border-l-green-500'
          }`}
        >
          <p className="text-sm font-medium text-slate-500 mb-1">Itens com Estoque Zerado</p>
          <p
            data-testid="card-zerados"
            className={`text-3xl font-bold ${zerados.length > 0 ? 'text-red-700' : 'text-green-600'}`}
          >
            {zerados.length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-red-50 flex justify-between items-center">
          <h2 className="font-bold text-red-800">⚠️ Atenção Necessária</h2>
          <span className="text-xs font-bold bg-red-200 text-red-800 px-2 py-1 rounded-full">
            {itensCriticos.length} alertas
          </span>
        </div>
        <div className="p-4">
          {ordenados.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">Nenhum item em nível crítico. Bom trabalho!</p>
          ) : (
            <ul className="space-y-3">
              {ordenados.map((item) => {
                const status = statusEstoque(item);
                return (
                  <li
                    key={item.id}
                    data-status={status}
                    className={`flex justify-between items-center p-3 rounded-lg border ${
                      status === 'ZERADO' ? 'bg-red-100 border-red-300' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-700">{item.descricao}</p>
                      <p className="text-xs text-slate-500 font-mono">{item.codigo}</p>
                      {status === 'ZERADO' && (
                        <span className="inline-block mt-1 text-xs font-bold bg-red-600 text-white px-2 py-0.5 rounded">
                          ZERADO – saída bloqueada
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Atual / Mínimo</p>
                      <p className="font-bold text-red-600">{item.estoqueAtual} / {item.estoqueMinimo}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
