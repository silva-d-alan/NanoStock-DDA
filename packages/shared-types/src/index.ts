export type PerfilUsuario = 'ADMIN' | 'ALMOXARIFE' | 'COMPRADOR' | 'GESTOR';

export interface UsuarioDTO {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
}

export interface LoginDTO {
  email: string;
  senha: string;
}

export interface LoginResponseDTO {
  token: string;
  usuario: UsuarioDTO;
}

export interface PastilhaDTO {
  id: string;
  codigo: string;
  descricao: string;
  fabricanteId: string;
  aplicacao: string;
  unidade: string;
  estoqueMinimo: number;
  estoqueAtual: number;
  ativo: boolean;
}

export interface CriarPastilhaDTO {
  codigo: string;
  descricao: string;
  fabricanteId: string;
  aplicacao: string;
  unidade: string;
  estoqueMinimo: number;
}

/** AJUSTE é gerado apenas pelo ajuste manual de inventário (RF14). */
export type TipoMovimentacao = 'ENTRADA' | 'SAIDA' | 'AJUSTE';

/** RN09 – setores de destino permitidos em uma saída. */
export type DestinoSaida = 'PRODUCAO' | 'MANUTENCAO' | 'TERCEIROS';

export interface CriarMovimentacaoDTO {
  pastilhaId: string;
  tipo: 'ENTRADA' | 'SAIDA';
  quantidade: number;
  /** Obrigatória quando tipo = ENTRADA (RF04). */
  notaFiscal?: string;
  /** Obrigatório quando tipo = SAIDA (RF05/RN09). */
  destino?: DestinoSaida;
  observacao?: string;
}

export interface AjusteInventarioDTO {
  pastilhaId: string;
  quantidadeContada: number;
  justificativa: string;
}
