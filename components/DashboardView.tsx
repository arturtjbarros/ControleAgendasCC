
import React, { useState } from 'react';
import { Search, Clock, Calendar, CheckCircle2, UserCheck, ArrowRight } from 'lucide-react';
import { Consultant, Appointment, AppointmentStatus } from '../types';
import { format, addDays, isAfter, isBefore, isSameDay } from 'date-fns';

interface DashboardViewProps {
  consultants: Consultant[];
  appointments: Appointment[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ consultants, appointments }) => {
  const stats = [
    { label: 'Total Consultores', value: consultants.length, icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Agendamentos Ativos', value: appointments.filter(a => a.status === AppointmentStatus.SCHEDULED).length, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Treinamentos Concluídos', value: 12, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Horas Alocadas (Mês)', value: `${appointments.length * 4}h`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  const upcomingAppointments = appointments
    .filter(a => isAfter(new Date(a.start), new Date()))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Hero Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1e3a5f] p-8 rounded-3xl text-white shadow-xl overflow-hidden relative">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Trainer<span className="text-blue-400">Scheduler</span></h2>
                <p className="text-blue-200 mb-6 max-w-md">Sistema simplificado de gestão de agendas para implantadores. Manhã e Tarde.</p>
                <div className="flex space-x-3">
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                    <span className="text-xs font-bold text-blue-300 block">MANHÃ</span>
                    <span className="text-lg font-bold">08:00 - 12:00</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                    <span className="text-xs font-bold text-blue-300 block">TARDE</span>
                    <span className="text-lg font-bold">14:00 - 18:00</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-blue-500/20 rounded-full flex items-center justify-center border border-white/10">
                   <Calendar size={64} className="text-blue-400 opacity-50" />
                </div>
              </div>
            </div>
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Minha Equipe</h3>
              <button className="text-blue-600 text-sm font-bold hover:underline">Ver todos</button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {consultants.map(c => (
                  <div key={c.id} className="flex items-center p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm mr-4" style={{ backgroundColor: c.color }}>
                      {c.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{c.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Tasks / Upcoming */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center">
              <Clock size={18} className="text-blue-600 mr-2" />
              <h3 className="font-bold text-slate-800">Próximas Agendas</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {upcomingAppointments.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  <Calendar size={40} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">Tudo tranquilo por aqui.</p>
                </div>
              ) : (
                upcomingAppointments.map(app => {
                  const consultant = consultants.find(c => c.id === app.consultantId);
                  const isMorning = new Date(app.start).getHours() < 12;
                  return (
                    <div key={app.id} className="p-6 hover:bg-blue-50/30 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${isMorning ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {isMorning ? 'Manhã' : 'Tarde'}
                        </span>
                        <span className="text-xs font-bold text-slate-400">{format(new Date(app.start), 'dd/MM')}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{app.clientName}</h4>
                      <div className="flex items-center text-xs font-bold text-slate-500">
                        <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: consultant?.color }}></div>
                        {consultant?.name}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button className="w-full py-3 text-xs font-black text-slate-400 hover:text-blue-600 tracking-widest uppercase transition-all flex items-center justify-center">
                Visualizar Agendas <ArrowRight size={14} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
