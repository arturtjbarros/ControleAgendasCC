
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Mail, Briefcase, Clock, Calendar as CalendarIcon, Shield, CheckCircle } from 'lucide-react';
import { Consultant } from '../types';
import { COLORS } from '../constants';

interface TeamViewProps {
  consultants: Consultant[];
  users: any[];
  onAdd: (c: Omit<Consultant, 'id'>, createAccount: boolean) => void;
  onUpdate: (id: string, c: Partial<Consultant>) => void;
  onDelete: (id: string) => void;
}

const TeamView: React.FC<TeamViewProps> = ({ consultants, users, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createAccount, setCreateAccount] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Consultant, 'id'>>({
    name: '',
    email: '',
    role: 'Implantador',
    color: COLORS[0],
    workStart: '08:00',
    workEnd: '17:00',
    workDays: [1, 2, 3, 4, 5],
  });

  const handleEdit = (c: Consultant) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      email: c.email,
      role: c.role,
      color: c.color,
      workStart: c.workStart,
      workEnd: c.workEnd,
      workDays: [...c.workDays],
    });
    setCreateAccount(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate(editingId, formData);
    } else {
      onAdd(formData, createAccount);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      role: 'Implantador',
      color: COLORS[0],
      workStart: '08:00',
      workEnd: '17:00',
      workDays: [1, 2, 3, 4, 5],
    });
    setCreateAccount(true);
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day].sort()
    }));
  };

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Equipe Técnica</h2>
          <p className="text-sm font-medium text-slate-400">Gerencie os implantadores e suas contas de acesso.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center shadow-xl shadow-blue-100 transition-all active:scale-95 font-black uppercase text-xs tracking-widest"
        >
          <Plus size={18} className="mr-2" /> Novo Consultor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {consultants.map((c) => {
          const userAccount = users.find(u => u.consultantId === c.id || u.email === c.email);
          return (
            <div key={c.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
              <div className="h-2 w-full" style={{ backgroundColor: c.color }}></div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg mr-4" style={{ backgroundColor: c.color }}>
                      {c.name[0]}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg leading-tight">{c.name}</h3>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{c.role}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(c)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDelete(c.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center text-xs font-bold text-slate-500">
                    <Mail size={16} className="mr-3 text-slate-300" /> {c.email}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs font-bold text-slate-500">
                      <Shield size={16} className="mr-3 text-slate-300" /> 
                      {userAccount ? (
                        <span className="text-emerald-600 flex items-center">Conta Ativa <CheckCircle size={12} className="ml-1" /></span>
                      ) : (
                        <span className="text-slate-400">Sem conta de acesso</span>
                      )}
                    </div>
                    {userAccount?.googleConnected && (
                      <div className="flex items-center text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                        Google Calendar ✓
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Clock size={14} className="mr-2" /> {c.workStart} - {c.workEnd}
                    </div>
                    <div className="flex space-x-1">
                      {weekDays.map((day, idx) => (
                        <span 
                          key={idx} 
                          className={`w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-black ${
                            c.workDays.includes(idx) ? 'bg-blue-600 text-white' : 'text-slate-300'
                          }`}
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-800">{editingId ? 'Editar' : 'Novo'} Implantador</h2>
                <p className="text-sm font-medium text-slate-500">Configure o perfil e acesso técnico.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Trash2 size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail</label>
                  <input 
                    required
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                    placeholder="joao@trainer.com"
                  />
                </div>
              </div>

              {!editingId && (
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-600 text-white rounded-xl mr-3">
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-blue-900 leading-none mb-1">Criar Conta de Acesso</p>
                      <p className="text-xs font-medium text-blue-600">Gera usuário e senha automaticamente.</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={createAccount}
                    onChange={e => setCreateAccount(e.target.checked)}
                    className="w-6 h-6 rounded-lg border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Horário e Dias de Atendimento</label>
                <div className="grid grid-cols-2 gap-4 mb-4">
                   <div className="bg-slate-50 p-4 rounded-2xl">
                     <span className="text-[10px] font-black text-slate-400 uppercase block mb-2">Entrada</span>
                     <input type="time" value={formData.workStart} onChange={e => setFormData({...formData, workStart: e.target.value})} className="bg-transparent font-bold text-slate-800 outline-none w-full" />
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl">
                     <span className="text-[10px] font-black text-slate-400 uppercase block mb-2">Saída</span>
                     <input type="time" value={formData.workEnd} onChange={e => setFormData({...formData, workEnd: e.target.value})} className="bg-transparent font-bold text-slate-800 outline-none w-full" />
                   </div>
                </div>
                <div className="flex justify-between bg-slate-50 p-3 rounded-2xl">
                  {weekDays.map((day, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`w-10 h-10 rounded-xl font-black transition-all shadow-sm ${
                        formData.workDays.includes(idx)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-300 border border-slate-100 hover:border-blue-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Cor no Calendário</label>
                <div className="flex space-x-3">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-xl border-4 transition-all hover:scale-110 ${formData.color === color ? 'border-slate-800 shadow-lg' : 'border-white shadow-sm'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 flex space-x-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-black uppercase text-xs tracking-widest transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95"
                >
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Consultor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamView;
