import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = JSON.parse(localStorage.getItem('usuario') ?? '{}');

  function sair() {
    localStorage.clear();
    navigate('/login');
  }

  const menu = [
    { nome: 'Dashboard', path: '/' },
    { nome: 'Pastilhas', path: '/pastilhas' },
    { nome: 'Movimentações', path: '/movimentacoes' },
    { nome: 'Alertas', path: '/alertas' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Menu Lateral */}
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

      {/* Conteúdo das Páginas */}
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <Outlet />
      </main>
    </div>
  );
}