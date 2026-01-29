
import React, { useState } from 'react';
import Layout from './components/Layout';
import DashboardView from './components/DashboardView';
import WeeklyScheduler from './components/WeeklyScheduler';
import TeamView from './components/TeamView';
import AuthView from './components/AuthView';
import { ViewType, User } from './types';
import { useStore } from './store';
import { Calendar, CheckCircle2, RefreshCw, Smartphone, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const store = useStore();
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  if (!store.currentUser) {
    return <AuthView store={store} onAuth={() => {}} />;
  }

  const user = store.currentUser;

  const handleConnectGoogle = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      await store.connectGoogle(user.id);
    } catch (err) {
      console.error(err);
      setSyncError("Não foi possível conectar ao Google. Verifique se o domínio está autorizado.");
    } finally {
      setIsSyncing(false);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView consultants={store.consultants} appointments={store.appointments} />;
      case 'calendar':
        return (
          <WeeklyScheduler 
            consultants={store.consultants} 
            appointments={store.appointments} 
            googleEvents={store.googleEvents}
            onAddAppointment={store.addAppointment}
            currentUser={user}
          />
        );
      case 'team':
        if (user.role !== 'ADMIN') return <div className="p-8 bg-red-50 text-red-600 font-bold rounded-2xl">Acesso Negado.</div>;
        return (
          <TeamView 
            consultants={store.consultants}
            users={store.users}
            onAdd={store.addConsultant}
            onUpdate={store.updateConsultant}
            onDelete={store.removeConsultant}
          />
        );
      case 'appointments':
        return (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Relatório de Agendas</h2>
                <p className="text-sm font-medium text-slate-400">Listagem completa de todos os treinamentos.</p>
              </div>
              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-xl text-blue-600 font-bold text-xs">
                <RefreshCw size={14} /> <span>Sincronizado</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-4 pb-2">Cliente / Empresa</th>
                    <th className="py-4 pb-2">Consultor Responsável</th>
                    <th className="py-4 pb-2">Período / Data</th>
                    <th className="py-4 pb-2">Status</th>
                    <th className="py-4 pb-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {store.appointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-300 font-medium">
                        Nenhuma agenda registrada no sistema.
                      </td>
                    </tr>
                  ) : (
                    store.appointments.map(app => {
                      const consultant = store.consultants.find(c => c.id === app.consultantId);
                      const isMorning = new Date(app.start).getHours() < 12;
                      return (
                        <tr key={app.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-5 font-bold text-slate-800">{app.clientName}</td>
                          <td className="py-5">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-lg mr-3 flex items-center justify-center text-white text-xs font-black shadow-sm" style={{ backgroundColor: consultant?.color }}>
                                {consultant?.name[0]}
                              </div>
                              <span className="text-sm font-bold text-slate-600">{consultant?.name}</span>
                            </div>
                          </td>
                          <td className="py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-800">{app.start.toLocaleDateString('pt-BR')}</span>
                              <span className={`text-[10px] font-black uppercase tracking-tighter ${isMorning ? 'text-amber-500' : 'text-indigo-500'}`}>
                                {isMorning ? 'Período Manhã' : 'Período Tarde'}
                              </span>
                            </div>
                          </td>
                          <td className="py-5">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                              {app.status}
                            </span>
                          </td>
                          <td className="py-5 text-right">
                            <button onClick={() => store.removeAppointment(app.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                              Excluir
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <UserIcon size={120} />
                </div>
                
                <div className="flex items-start mb-10 relative z-10">
                   <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-200 mr-8">
                      {user.name[0]}
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-slate-800 leading-tight">{user.name}</h2>
                      <p className="text-slate-400 font-bold mb-3">{user.email}</p>
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                         Role: {user.role}
                      </span>
                   </div>
                </div>

                <div className="space-y-8 relative z-10">
                   <div>
                      <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center">
                         <Calendar size={20} className="mr-2 text-blue-600" />
                         Integração Google Calendar
                      </h3>
                      <p className="text-sm font-medium text-slate-500 mb-6">
                         Vincule sua agenda do Google para que os treinamentos marcados aqui apareçam **automaticamente** em seu calendário pessoal.
                      </p>
                      
                      {syncError && (
                        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center text-xs font-bold border border-red-100">
                           <AlertCircle size={16} className="mr-2" />
                           {syncError}
                        </div>
                      )}

                      {user.googleConnected ? (
                        <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                           <div className="flex items-center">
                              <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-emerald-100">
                                 <CheckCircle2 size={24} />
                              </div>
                              <div>
                                 <p className="text-emerald-900 font-black leading-none mb-1">Conta Real Conectada</p>
                                 <p className="text-emerald-600 text-xs font-bold">Gravação em tempo real ativa</p>
                              </div>
                           </div>
                           <button className="text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:underline">Desconectar</button>
                        </div>
                      ) : (
                        <button 
                          disabled={isSyncing}
                          onClick={handleConnectGoogle}
                          className="w-full py-4 bg-white border-2 border-slate-100 hover:border-blue-500 rounded-2xl flex items-center justify-center space-x-3 transition-all group shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                           {isSyncing ? (
                             <Loader2 className="animate-spin text-blue-600" size={20} />
                           ) : (
                             <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                           )}
                           <span className="font-black text-slate-700 group-hover:text-blue-600">
                             {isSyncing ? 'Autenticando...' : 'Autorizar Sincronização Google'}
                           </span>
                        </button>
                      )}
                   </div>

                   <div className="pt-8 border-t border-slate-50">
                      <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center">
                         <Smartphone size={20} className="mr-2 text-blue-600" />
                         Segurança e Conta
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                         <button className="p-4 bg-slate-50 rounded-2xl text-left hover:bg-slate-100 transition-colors">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Senha</p>
                            <p className="font-bold text-slate-800">Alterar Senha de Acesso</p>
                         </button>
                         <button className="p-4 bg-slate-50 rounded-2xl text-left hover:bg-slate-100 transition-colors">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Notificações</p>
                            <p className="font-bold text-slate-800">E-mail e WhatsApp</p>
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        );
      default:
        return <div>Em breve...</div>;
    }
  };

  return (
    <Layout 
      activeView={activeView} 
      onViewChange={setActiveView} 
      user={user} 
      onLogout={store.logout}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
