import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@dda.com');
  const [senha, setSenha] = useState('admin123');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      const { data } = await api.post('/auth/login', { email, senha });
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      navigate('/');
    } catch {
      setErro('Email ou senha inválidos.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-200">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
        
        {/* ÁREA DA LOGO */}
        <div className="flex justify-center mb-6">
          <img 
            src="/logo.png" 
            alt="NanoStock Logo" 
            className="w-32 h-32 object-contain rounded-2xl shadow-md"
          />
        </div>

        <h1 className="text-2xl font-bold mb-1 text-center text-slate-800">NanoStock</h1>
        <p className="text-slate-500 mb-6 text-sm text-center">Controle de Pastilhas Industriais</p>

        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring focus:border-blue-300"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="block text-sm font-medium mb-1">Senha</label>
        <input
          type="password"
          className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring focus:border-blue-300"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        {erro && <p className="text-red-600 text-sm mb-3">{erro}</p>}

        <button
          type="submit"
          className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg font-medium transition-colors"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}