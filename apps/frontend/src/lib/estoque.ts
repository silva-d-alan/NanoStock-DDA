export type TipoMov = 'ENTRADA' | 'SAIDA';

/** RN09 – setores de destino de uma saída */
export const DESTINOS = [
  { value: 'PRODUCAO', label: 'Produção' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
  { value: 'TERCEIROS', label: 'Terceiros' },
] as const;
export type Destino = (typeof DESTINOS)[number]['value'];

/** RN05 – mesmo mínimo exigido pelo backend */
export const JUSTIFICATIVA_MIN = 10;

export interface PastilhaResumo {
  id: string;
  codigo: string;
  descricao: string;
  estoqueAtual: number;
  estoqueMinimo: number;
}

export interface MovimentacaoInput {
  tipo: TipoMov;
  pastilhaId: string;
  quantidade: number;
  notaFiscal?: string;
  destino?: Destino | '';
  observacao?: string;
}

export interface AjusteInput {
  pastilhaId: string;
  quantidadeContada: number;
  justificativa: string;
}

/** RN10 – saldo previsto após a movimentação */
export function calcularSaldo(saldo: number, tipo: TipoMov, quantidade: number): number {
  return tipo === 'ENTRADA' ? saldo + quantidade : saldo - quantidade;
}

/** RF04 / RF05 / RN01 / RN04 / RN09 – devolve a lista de erros (vazia = válido) */
export function validarMovimentacao(input: MovimentacaoInput, pastilha?: PastilhaResumo): string[] {
  const erros: string[] = [];
  if (!pastilha) erros.push('Selecione um item.');
  if (!Number.isInteger(input.quantidade) || input.quantidade <= 0) {
    erros.push('Quantidade deve ser um número inteiro maior que zero.');
  }
  if (input.tipo === 'ENTRADA' && !input.notaFiscal?.trim()) {
    erros.push('Informe a nota fiscal da entrada.');
  }
  if (input.tipo === 'SAIDA') {
    if (!DESTINOS.some((d) => d.value === input.destino)) erros.push('Informe o setor de destino.');
    if (pastilha?.estoqueAtual === 0) {
      erros.push('Item com estoque zerado: saída bloqueada.');
    } else if (pastilha && input.quantidade > pastilha.estoqueAtual) {
      erros.push(`Quantidade superior ao saldo disponível (${pastilha.estoqueAtual}).`);
    }
  }
  return erros;
}

/** RF14 / RN05 */
export function validarAjuste(quantidadeContada: number, justificativa: string, pastilha?: PastilhaResumo): string[] {
  const erros: string[] = [];
  if (!pastilha) erros.push('Selecione um item.');
  if (!Number.isInteger(quantidadeContada) || quantidadeContada < 0) {
    erros.push('Quantidade contada deve ser um número inteiro maior ou igual a zero.');
  } else if (pastilha && quantidadeContada === pastilha.estoqueAtual) {
    erros.push('A quantidade contada é igual ao saldo do sistema; não há o que ajustar.');
  }
  if (justificativa.trim().length < JUSTIFICATIVA_MIN) {
    erros.push(`Justificativa obrigatória (mínimo de ${JUSTIFICATIVA_MIN} caracteres).`);
  }
  return erros;
}

/** RF08 / RN04 */
export type StatusEstoque = 'ZERADO' | 'CRITICO' | 'OK';

export function statusEstoque(p: Pick<PastilhaResumo, 'estoqueAtual' | 'estoqueMinimo'>): StatusEstoque {
  if (p.estoqueAtual <= 0) return 'ZERADO';
  if (p.estoqueAtual <= p.estoqueMinimo) return 'CRITICO';
  return 'OK';
}

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** RF03 – busca por código ou descrição, ignorando caixa e acentos */
export function filtrarPastilhas<T extends { codigo: string; descricao: string }>(lista: T[], termo: string): T[] {
  const t = normalizar(termo);
  if (!t) return lista;
  return lista.filter((p) => normalizar(p.codigo).includes(t) || normalizar(p.descricao).includes(t));
}

/** Texto do detalhe de uma movimentação no histórico: NF, destino ou justificativa */
export function detalheMovimentacao(m: {
  tipo: string;
  notaFiscal?: string | null;
  destino?: string | null;
  justificativa?: string | null;
  observacao?: string | null;
}): string {
  if (m.tipo === 'ENTRADA' && m.notaFiscal) return `NF ${m.notaFiscal}`;
  if (m.tipo === 'SAIDA' && m.destino) {
    return DESTINOS.find((d) => d.value === m.destino)?.label ?? m.destino;
  }
  if (m.tipo === 'AJUSTE' && m.justificativa) return m.justificativa;
  return m.observacao || '-';
}
