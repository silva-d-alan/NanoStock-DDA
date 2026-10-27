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
}

export interface CriarPastilhaDTO {
  codigo: string;
  descricao: string;
  fabricanteId: string;
  aplicacao: string;
  unidade: string;
  estoqueMinimo: number;
}

export type TipoMovimentacao = 'ENTRADA' | 'SAIDA';

export interface CriarMovimentacaoDTO {
  pastilhaId: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  observacao?: string;
}