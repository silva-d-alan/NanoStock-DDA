export type Perfil = 'ADMIN' | 'ALMOXARIFE' | 'COMPRADOR' | 'GESTOR';

const TODOS: Perfil[] = ['ADMIN', 'ALMOXARIFE', 'COMPRADOR', 'GESTOR'];

/** RF12 – menu e rotas liberados para cada perfil */
export const MENUS: { nome: string; path: string; perfis: Perfil[] }[] = [
  { nome: 'Dashboard', path: '/', perfis: TODOS },
  { nome: 'Pastilhas', path: '/pastilhas', perfis: ['ADMIN', 'ALMOXARIFE', 'COMPRADOR'] },
  { nome: 'Fornecedores', path: '/fabricantes', perfis: ['ADMIN', 'ALMOXARIFE', 'COMPRADOR'] },
  { nome: 'Movimentações', path: '/movimentacoes', perfis: ['ADMIN', 'ALMOXARIFE'] },
  // RN03 – o alerta de estoque mínimo é dirigido ao Almoxarife e ao Comprador
  { nome: 'Alertas', path: '/alertas', perfis: TODOS },
  { nome: 'Relatórios', path: '/relatorios', perfis: TODOS },
  { nome: 'Usuários', path: '/usuarios', perfis: ['ADMIN'] },
];

/** Rota não cadastrada só é acessível ao ADMIN. */
export function podeAcessar(perfil: string | undefined | null, rota: string): boolean {
  if (!perfil) return false;
  const menu = MENUS.find((m) => m.path === rota);
  return menu ? menu.perfis.includes(perfil as Perfil) : perfil === 'ADMIN';
}

export function menusDoPerfil(perfil: string | undefined | null) {
  return MENUS.filter((m) => podeAcessar(perfil, m.path));
}

/** Usuário gravado no login; devolve {} se não houver sessão ou o JSON estiver corrompido. */
export function usuarioLogado(): { nome?: string; perfil?: string } {
  try {
    return JSON.parse(localStorage.getItem('usuario') ?? '{}') ?? {};
  } catch {
    return {};
  }
}
