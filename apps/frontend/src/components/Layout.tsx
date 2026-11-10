import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = JSON.parse(localStorage.getItem('usuario') ?? '{}');

  function sair() {
    localStorage.clear();
    navigate('/login');
  }

  // Agora o menu tem a regra de quem pode ver o quê
  const todosOsMenus = [
    { nome: 'Dashboard', path: '/', perfis: ['ADMIN', 'ALMOXARIFE', 'COMPRADOR', 'GESTOR'] },
    { nome: 'Pastilhas', path: '/pastilhas', perfis: ['ADMIN', 'ALMOXARIFE', 'COMPRADOR'] },
    { nome: 'Fornecedores', path: '/fabricantes', perfis: ['ADMIN', 'ALMOXARIFE', 'COMPRADOR'] },
    { nome: 'Movimentações', path: '/movimentacoes', perfis: ['ADMIN', 'ALMOXARIFE'] },
    { nome: 'Alertas', path: '/alertas', perfis: ['ADMIN', 'COMPRADOR', 'GESTOR'] },
    { nome: 'Usuários', path: '/usuarios', perfis: ['ADMIN'] }, // <-- Adicionado aqui
  ];

  // Filtra o menu baseado no perfil do usuário logado
  const menu = todosOsMenus.filter((item) => item.perfis.includes(usuario.perfil));

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <img src="/logo.png" alt="NanoStock" className="w-10 h-10 object-contain rounded-lg" />
          <span className="font-bold text-xl">NanoStock</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {item.nome}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <p className="text-sm text-slate-400 mb-2">Logado como:</p>
          <p className="font-medium mb-4">{usuario.nome}</p>
          <button
            onClick={sair}
            className="w-full bg-slate-800 hover:bg-red-600 text-white py-2 rounded-lg transition-colors"
          >
            Sair do sistema
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <Outlet />
      </main>
    </div>
  );
}