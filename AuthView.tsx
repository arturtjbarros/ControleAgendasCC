
import React, { useState } from 'react';
import { UserRole } from '../types';
import { LogIn, UserPlus, ShieldCheck, AlertCircle } from 'lucide-react';

interface AuthViewProps {
  onAuth: (user: any) => void;
  store: any;
}

const AuthView: React.FC<AuthViewProps> = ({ store }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // If there are already users, only login is allowed (except for the very first user who becomes admin)
  const isFirstUser = store.users.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const user = store.login(email, password);
      if (!user) setError('E-mail ou senha incorretos.');
    } else {
      if (!isFirstUser) {
        setError('O cadastro de novos usuários é restrito aos administradores.');
        return;
      }
      if (!name || !email || !password) {
        setError('Preencha todos os campos.');
        return;
      }
      store.register(name, email, password, 'ADMIN');
    }
  };

  return (
    <div className="min-h-screen bg-[#1e3a5f] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="p-8 text-center bg-slate-50 border-b border-slate-100">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl text-white mb-4 shadow-lg shadow-blue-200">
            {isLogin ? <LogIn size={32} /> : <UserPlus size={32} />}
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Trainer<span className="text-blue-600">Scheduler</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isLogin ? 'Bem-vindo de volta! Acesse sua conta.' : 'Configuração Inicial: Crie o usuário Administrador.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center">
              <AlertCircle size={14} className="mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {!isLogin && isFirstUser && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Seu nome"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>{isLogin ? 'Entrar no Sistema' : 'Criar Administrador'}</span>
          </button>

          {isFirstUser && (
            <div className="pt-4 text-center">
              <button 
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors"
              >
                {isLogin ? 'Primeiro acesso? Criar Admin' : 'Já tem uma conta? Faça login'}
              </button>
            </div>
          )}
        </form>

        <div className="px-8 pb-8 flex items-center justify-center space-x-2 text-slate-300">
          <ShieldCheck size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Acesso Seguro SSL</span>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
