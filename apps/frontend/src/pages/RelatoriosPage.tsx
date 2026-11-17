import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { baixarArquivo } from '../lib/csv';
import { DESTINOS } from '../lib/estoque';

/** RN08 – relatórios de consumo consideram no mínimo 30 dias */
const PERIODO_MINIMO_DIAS = 30;

async function baixarCsvDaApi(rota: string, nomeArquivo: string, params?: Record<string, unknown>) {
  try {
    const { data } = await api.get(rota, { params, responseType: 'blob' });
    baixarArquivo(nomeArquivo, data);
  } catch {
    alert('Não foi possível exportar o relatório.');
  }
}

/** RF11 / RF13 – relatórios de consumo e de necessidade de reposição, com exportação em CSV */
export default function RelatoriosPage() {
  const [dias, setDias] = useState(PERIODO_MINIMO_DIAS);
  const periodo = Math.max(Number(dias) || PERIODO_MINIMO_DIAS, PERIODO_MINIMO_DIAS);

  const { data: consumo, isLoading: carregandoConsumo } = useQuery({
    queryKey: ['relatorios', 'consumo', periodo],
    queryFn: async () => (await api.get('/relatorios/consumo', { params: { dias: periodo } })).data,
  });

  const { data: reposicao, isLoading: carregandoReposicao } = useQuery({
    queryKey: ['relatorios', 'reposicao'],
    queryFn: async () => (await api.get('/relatorios/reposicao')).data,
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap justify-between items-center gap-3">
          <h2 className="font-bold text-slate-700">Consumo por item</h2>
          <div className="flex items-center gap-3">
            <label htmlFor="rel-dias" className="text-sm text-slate-600">Período (dias, mínimo {PERIODO_MINIMO_DIAS})</label>
            <input
              id="rel-dias"
              type="number"
              min={PERIODO_MINIMO_DIAS}
              className="w-24 border rounded-lg px-3 py-1"
              value={dias}
              onChange={(e) => setDias(Number(e.target.value))}
            />
            <button
              onClick={() => baixarCsvDaApi('/relatorios/consumo/csv', `consumo_${periodo}_dias.csv`, { dias: periodo })}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
            >
              Exportar CSV
            </button>
          </div>
        </div>
        {carregandoConsumo ? (
          <p className="p-4">Carregando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="p-4 font-medium text-slate-600">Código</th>
                  <th className="p-4 font-medium text-slate-600">Descrição</th>
                  {DESTINOS.map((d) => (
                    <th key={d.value} className="p-4 font-medium text-slate-600 text-center">{d.label}</th>
                  ))}
                  <th className="p-4 font-medium text-slate-600 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {consumo?.itens.map((i: any) => (
                  <tr key={i.pastilhaId} className="border-b border-slate-100">
                    <td className="p-4 font-mono text-sm">{i.codigo}</td>
                    <td className="p-4 font-medium">{i.descricao}</td>
                    {DESTINOS.map((d) => (
                      <td key={d.value} className="p-4 text-center">{i.porDestino[d.value] ?? 0}</td>
                    ))}
                    <td className="p-4 text-center font-bold">{i.total}</td>
                  </tr>
                ))}
                {consumo?.itens.length === 0 && (
                  <tr>
                    <td colSpan={DESTINOS.length + 3} className="p-8 text-center text-slate-500">
                      Nenhuma saída registrada nos últimos {consumo.periodoDias} dias.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-700">Necessidade de reposição</h2>
          <button
            onClick={() => baixarCsvDaApi('/relatorios/reposicao/csv', 'reposicao.csv')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
          >
            Exportar CSV
          </button>
        </div>
        {carregandoReposicao ? (
          <p className="p-4">Carregando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="p-4 font-medium text-slate-600">Código</th>
                  <th className="p-4 font-medium text-slate-600">Descrição</th>
                  <th className="p-4 font-medium text-slate-600">Fornecedor</th>
                  <th className="p-4 font-medium text-slate-600 text-center">Atual / Mínimo</th>
                  <th className="p-4 font-medium text-slate-600 text-center">Sugestão de compra</th>
                </tr>
              </thead>
              <tbody>
                {reposicao?.map((p: any) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="p-4 font-mono text-sm">{p.codigo}</td>
                    <td className="p-4 font-medium">{p.descricao}</td>
                    <td className="p-4 text-slate-500">{p.fabricante || '-'}</td>
                    <td className="p-4 text-center font-bold text-red-600">{p.estoqueAtual} / {p.estoqueMinimo}</td>
                    <td className="p-4 text-center font-bold">{p.sugestaoCompra}</td>
                  </tr>
                ))}
                {reposicao?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">Nenhum item precisa de reposição.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
