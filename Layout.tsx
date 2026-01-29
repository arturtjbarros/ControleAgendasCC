
import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Clock, 
  Settings,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { ViewType, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SALES', 'CS'] },
    { id: 'calendar', label: 'Calendário', icon: Calendar, roles: ['ADMIN', 'TRAINER', 'SALES', 'CS'] },
    { id: 'team', label: 'Time (Consultores)', icon: Users, roles: ['ADMIN'] },
    { id: 'appointments', label: 'Agendamentos', icon: Clock, roles: ['ADMIN', 'SALES', 'CS'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

  const roleLabels: Record<string, string> = {
    'ADMIN': 'Administrador',
    'TRAINER': 'Implantador',
    'SALES': 'Vendedor',
    'CS': 'Customer Success'
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#1e3a5f] text-white transition-all duration-300 flex flex-col shadow-xl z-20`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-700">
          {isSidebarOpen && <span className="text-xl font-bold tracking-tight">Trainer<span className="text-blue-400">Scheduler</span></span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-700 rounded-md">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-2">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id as ViewType)}
                className={`w-full flex items-center p-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} className={isSidebarOpen ? 'mr-3' : 'mx-auto'} />
                {isSidebarOpen && <span className="font-bold text-sm">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-2">
          <button 
            onClick={() => onViewChange('profile')}
            className={`w-full flex items-center p-3 rounded-xl transition-colors ${activeView === 'profile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <UserIcon size={20} className={isSidebarOpen ? 'mr-3' : 'mx-auto'} />
            {isSidebarOpen && <span className="text-sm font-bold">Meu Perfil</span>}
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center p-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
          >
            <LogOut size={20} className={isSidebarOpen ? 'mr-3' : 'mx-auto'} />
            {isSidebarOpen && <span className="text-sm font-bold">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center px-8 justify-between shadow-sm z-10">
          <div>
            <h1 className="text-xl font-black text-slate-800">
              {menuItems.find(i => i.id === activeView)?.label || (activeView === 'profile' ? 'Meu Perfil' : 'Dashboard')}
            </h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mt-1">CC Controle de Agendas</p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-900 leading-tight">{user.name}</p>
              <div className="flex items-center justify-end text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                <ShieldCheck size={10} className="mr-1 text-emerald-500" />
                {roleLabels[user.role]}
              </div>
            </div>
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg ${user.role === 'ADMIN' ? 'bg-slate-800' : 'bg-blue-600'}`}>
              {user.name[0]}
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto custom-scrollbar p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
