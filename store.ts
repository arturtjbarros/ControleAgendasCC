
import { useState, useEffect } from 'react';
import { Consultant, Appointment, TimeBlock, User, UserRole, GoogleEvent, AppointmentStatus } from './types';
import { INITIAL_CONSULTANTS } from './constants';
import { setHours, setMinutes, addDays, startOfWeek, addWeeks } from 'date-fns';

// CONFIGURAÇÃO GOOGLE (Substituir pela sua Client ID do Google Cloud Console)
const GOOGLE_CLIENT_ID = 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

const getStorage = <T>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultValue;
  try {
    const parsed = JSON.parse(saved);
    if (key === 'appointments' || key === 'googleEvents') {
      return parsed.map((a: any) => ({ ...a, start: new Date(a.start), end: new Date(a.end) })) as unknown as T;
    }
    return parsed;
  } catch {
    return defaultValue;
  }
};

let consultants: Consultant[] = getStorage('consultants', [...INITIAL_CONSULTANTS]);
let appointments: Appointment[] = getStorage('appointments', []);
let googleEvents: GoogleEvent[] = getStorage('googleEvents', []);
let users: User[] = getStorage('users', []);
let currentUser: User | null = getStorage('currentUser', null);

export const useStore = () => {
  const [state, setState] = useState({
    consultants,
    appointments,
    googleEvents,
    users,
    currentUser,
  });

  const save = (newState: Partial<typeof state>) => {
    const updated = { ...state, ...newState };
    setState(updated);
    localStorage.setItem('consultants', JSON.stringify(updated.consultants));
    localStorage.setItem('appointments', JSON.stringify(updated.appointments));
    localStorage.setItem('googleEvents', JSON.stringify(updated.googleEvents));
    localStorage.setItem('users', JSON.stringify(updated.users));
    localStorage.setItem('currentUser', JSON.stringify(updated.currentUser));
  };

  // Inicializa GAPI para chamadas de Calendário
  const initGapi = async () => {
    return new Promise((resolve) => {
      // @ts-ignore
      gapi.load('client', async () => {
        // @ts-ignore
        await gapi.client.init({
          clientId: GOOGLE_CLIENT_ID,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        });
        resolve(true);
      });
    });
  };

  const register = (name: string, email: string, password: string, role: UserRole = 'SALES') => {
    const finalRole = state.users.length === 0 ? 'ADMIN' : role;
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      role: finalRole,
      password,
      googleConnected: false
    };
    save({ users: [...state.users, newUser], currentUser: newUser });
    return newUser;
  };

  const login = (email: string, password: string) => {
    const user = state.users.find(u => u.email === email && u.password === password);
    if (user) {
      save({ currentUser: user });
      return user;
    }
    return null;
  };

  const logout = () => {
    save({ currentUser: null });
  };

  const addConsultant = (c: Omit<Consultant, 'id'>, createAccount: boolean = false) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newC = { ...c, id };
    
    let updatedUsers = [...state.users];
    if (createAccount) {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: c.name,
        email: c.email,
        role: 'TRAINER',
        password: 'password123',
        consultantId: id,
        googleConnected: false
      };
      updatedUsers.push(newUser);
      newC.userId = newUser.id;
    }

    save({ consultants: [...state.consultants, newC], users: updatedUsers });
  };

  const updateConsultant = (id: string, updates: Partial<Consultant>) => {
    const updated = state.consultants.map(c => c.id === id ? { ...c, ...updates } : c);
    save({ consultants: updated });
  };

  const removeConsultant = (id: string) => {
    const updated = state.consultants.filter(c => c.id !== id);
    save({ consultants: updated });
  };

  const addAppointment = async (a: Omit<Appointment, 'id'>) => {
    const appointmentId = Math.random().toString(36).substr(2, 9);
    const newA = { 
      ...a, 
      id: appointmentId,
      bookedById: state.currentUser?.id
    };

    const consultantUser = state.users.find(u => u.consultantId === a.consultantId || u.email === state.consultants.find(c => c.id === a.consultantId)?.email);
    
    // Tentar gravar no Google Calendar Real se estiver autenticado
    if (consultantUser?.googleConnected) {
      try {
        await initGapi();
        // @ts-ignore
        const token = localStorage.getItem(`google_token_${consultantUser.id}`);
        if (token) {
          // @ts-ignore
          gapi.client.setToken({ access_token: token });
          
          const event = {
            'summary': `[TrainerScheduler] ${a.clientName}`,
            'description': `Treinamento agendado via Controle de Agendas CC.`,
            'start': {
              'dateTime': a.start.toISOString(),
              'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            'end': {
              'dateTime': a.end.toISOString(),
              'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
            }
          };

          // @ts-ignore
          await gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': event
          });
          console.log("Evento gravado no Google com sucesso!");
        }
      } catch (error) {
        console.error("Erro ao gravar no Google Calendar:", error);
      }
    }

    save({ 
      appointments: [...state.appointments, newA]
    });
  };

  const removeAppointment = (id: string) => {
    const updated = state.appointments.filter(a => a.id !== id);
    save({ appointments: updated });
  };

  const connectGoogle = async (userId: string) => {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: async (response: any) => {
          if (response.error !== undefined) {
            reject(response);
            return;
          }
          
          // Guardar token para uso futuro
          localStorage.setItem(`google_token_${userId}`, response.access_token);
          
          const updatedUsers = state.users.map(u => 
            u.id === userId ? { ...u, googleConnected: true } : u
          );
          const updatedCurrentUser = state.currentUser?.id === userId 
            ? { ...state.currentUser, googleConnected: true } 
            : state.currentUser;
            
          save({ 
            users: updatedUsers, 
            currentUser: updatedCurrentUser
          });
          resolve(true);
        },
      });
      client.requestAccessToken();
    });
  };

  return {
    ...state,
    register,
    login,
    logout,
    addConsultant,
    updateConsultant,
    removeConsultant,
    addAppointment,
    removeAppointment,
    connectGoogle,
  };
};
