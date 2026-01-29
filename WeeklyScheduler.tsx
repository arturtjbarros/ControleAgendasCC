
import React, { useState } from 'react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  eachDayOfInterval, 
  setHours, 
  setMinutes, 
  isSameDay, 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Info, AlertTriangle, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import { Consultant, Appointment, AppointmentStatus, User, GoogleEvent } from '../types';

interface WeeklySchedulerProps {
  consultants: Consultant[];
  appointments: Appointment[];
  googleEvents: GoogleEvent[];
  onAddAppointment: (a: Omit<Appointment, 'id'>) => void;
  currentUser?: User | null;
}

type Period = 'MORNING' | 'AFTERNOON';

const WeeklyScheduler: React.FC<WeeklySchedulerProps> = ({ 
  consultants, 
  appointments,
  googleEvents,
  onAddAppointment,
  currentUser
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookingDetails, setBookingDetails] = useState<{ date: Date; period: Period; consultantId?: string } | null>(null);
  const [clientName, setClientName] = useState('');

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = addDays(startDate, 4); // Seg a Sex
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const goToday = () => setCurrentDate(new Date());

  const getPeriodRange = (date: Date, period: Period) => {
    if (period === 'MORNING') {
      return { start: setMinutes(setHours(date, 8), 0), end: setMinutes(setHours(date, 12), 0) };
    }
    return { start: setMinutes(setHours(date, 14), 0), end: setMinutes(setHours(date, 18), 0) };
  };

  const getOccupancyInPeriod = (consultantId: string, date: Date, period: Period) => {
    const range = getPeriodRange(date, period);
    
    // Check internal appointments
    const internal = appointments.find(app => {
      if (app.consultantId !== consultantId) return false;
      const appStart = new Date(app.start);
      const appEnd = new Date(app.end);
      return (appStart < range.end && appEnd > range.start);
    });

    if (internal) return { type: 'INTERNAL', data: internal };

    // Check external google events
    const external = googleEvents.find(evt => {
      if (evt.consultantId !== consultantId) return false;
      const evtStart = new Date(evt.start);
      const evtEnd = new Date(evt.end);
      return (evtStart < range.end && evtEnd > range.start);
    });

    if (external) return { type: 'EXTERNAL', data: external };

    return null;
  };

  const handleBookingClick = (date: Date, period: Period, consultantId: string) => {
    setBookingDetails({ date, period, consultantId });
    setClientName('');
  };

  const confirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDetails || !bookingDetails.consultantId || !clientName) return;

    const range = getPeriodRange(bookingDetails.date, bookingDetails.period);

    onAddAppointment({
      consultantId: bookingDetails.consultantId,
      clientName,
      title: `Treinamento: ${clientName}`,
      start: range.start,
      end: range.end,
      status: AppointmentStatus.SCHEDULED,
    });

    setBookingDetails(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Google Calendar sync banner for the user */}
      {currentUser && !currentUser.googleConnected && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center text-amber-700 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle size={16} className="mr-3" />
            Sincronize seu Google Calendar no Perfil para ver reuniões externas
          </div>
          <CalendarIcon size={14} className="text-amber-400" />
        </div>
      )}

      {/* Header Controls */}
      <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h2 className="text-xl font-bold text-slate-800">
            {format(startDate, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <div className="flex border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <button onClick={prevWeek} className="p-2 bg-white hover:bg-slate-50 border-r border-slate-200 text-slate-600 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={goToday} className="px-4 py-2 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 border-r border-slate-200 transition-colors">
              Hoje
            </button>
            <button onClick={nextWeek} className="p-2 bg-white hover:bg-slate-50 text-slate-600 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-medium">
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-slate-500">Disponível</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
            <span className="text-slate-500">Google Event</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
            <span className="text-slate-500">Ocupado</span>
          </div>
        </div>
      </div>

      {/* Scheduler Grid */}
      <div className="flex-1 overflow-hidden flex flex-col p-4">
        <div className="grid grid-cols-6 gap-2 flex-1">
          {/* Header Row */}
          <div className="h-10"></div>
          {days.map(day => (
            <div key={day.toString()} className="text-center h-10 flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">
                {format(day, 'EEEE', { locale: ptBR })}
              </span>
              <span className={`text-sm font-bold ${isSameDay(day, new Date()) ? 'text-blue-600 underline decoration-2' : 'text-slate-700'}`}>
                {format(day, 'd MMM')}
              </span>
            </div>
          ))}

          {/* Periods Rows */}
          {(['MORNING', 'AFTERNOON'] as Period[]).map((period) => (
            <React.Fragment key={period}>
              <div className="flex items-center justify-center bg-slate-100 rounded-xl border border-slate-200/50">
                <span className="text-xs font-black text-slate-400 rotate-[-90deg] uppercase tracking-widest">
                  {period === 'MORNING' ? 'Manhã (08-12)' : 'Tarde (14-18)'}
                </span>
              </div>
              {days.map(day => (
                <div key={`${day}-${period}`} className="flex flex-col space-y-1.5 min-h-0 overflow-y-auto custom-scrollbar p-1">
                  {consultants.map(consultant => {
                    const occupancy = getOccupancyInPeriod(consultant.id, day, period);
                    const isWorkDay = consultant.workDays.includes(day.getDay());
                    
                    if (!isWorkDay) return null;

                    if (occupancy) {
                      if (occupancy.type === 'INTERNAL') {
                        const app = occupancy.data as Appointment;
                        return (
                          <div 
                            key={consultant.id}
                            className="group relative p-2 rounded-lg text-white shadow-sm transition-all flex flex-col justify-center"
                            style={{ backgroundColor: consultant.color }}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] font-bold uppercase opacity-80 truncate">{consultant.name}</span>
                              <Info size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-xs font-bold truncate">{app.clientName}</span>
                          </div>
                        );
                      } else {
                        const evt = occupancy.data as GoogleEvent;
                        return (
                          <div 
                            key={consultant.id}
                            className="group relative p-2 rounded-lg bg-slate-200 border border-slate-300 text-slate-600 shadow-sm transition-all flex flex-col justify-center"
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] font-black uppercase opacity-60 truncate">{consultant.name}</span>
                              <ExternalLink size={10} className="opacity-40" />
                            </div>
                            <span className="text-[10px] font-bold truncate leading-tight">{evt.title}</span>
                            <span className="text-[8px] font-black uppercase opacity-50">Ocupado (Google)</span>
                          </div>
                        );
                      }
                    }

                    return (
                      <button
                        key={consultant.id}
                        onClick={() => handleBookingClick(day, period, consultant.id)}
                        className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 text-emerald-700 transition-all group"
                      >
                        <div className="flex flex-col items-start text-left">
                          <span className="text-[10px] font-bold uppercase text-emerald-600/70">{consultant.name}</span>
                          <span className="text-xs font-semibold">Livre</span>
                        </div>
                        <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              ))}
              {period === 'MORNING' && <div className="col-span-6 h-4 flex items-center justify-center opacity-30 select-none">
                <div className="w-full h-[1px] bg-slate-300"></div>
                <span className="px-4 text-[9px] font-bold text-slate-400 whitespace-nowrap">INTERVALO ALMOÇO</span>
                <div className="w-full h-[1px] bg-slate-300"></div>
              </div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Simple Booking Modal */}
      {bookingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Novo Agendamento</h2>
                <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
                  {format(bookingDetails.date, "EEEE, d 'de' MMMM", { locale: ptBR })} • {bookingDetails.period === 'MORNING' ? 'Manhã' : 'Tarde'}
                </p>
              </div>
              <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <Plus size={24} />
              </div>
            </div>
            <form onSubmit={confirmBooking} className="p-6 space-y-5">
              <div className="flex items-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mr-3 shadow-sm" style={{ backgroundColor: consultants.find(c => c.id === bookingDetails.consultantId)?.color }}>
                  {consultants.find(c => c.id === bookingDetails.consultantId)?.name[0]}
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-400 uppercase leading-none mb-1">Consultor Selecionado</p>
                  <p className="font-bold text-slate-800">{consultants.find(c => c.id === bookingDetails.consultantId)?.name}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Cliente / Empresa</label>
                <input 
                  required
                  autoFocus
                  type="text" 
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-300 font-medium"
                  placeholder="Nome do cliente ou empresa"
                />
              </div>

              <div className="pt-2 flex space-x-3">
                <button 
                  type="button"
                  onClick={() => setBookingDetails(null)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                  Agendar Período
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyScheduler;
