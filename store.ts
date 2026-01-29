
import { useState, useEffect } from 'react';
import { Consultant, Appointment, TimeBlock, User, UserRole, GoogleEvent, AppointmentStatus } from './types';
import { INITIAL_CONSULTANTS } from './constants';
import { setHours, setMinutes, addDays, startOfWeek, addWeeks } from 'date-fns';

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

  const addAppointment = (a: Omit<Appointment, 'id'>) => {
    const appointmentId = Math.random().toString(36).substr(2, 9);
    const newA = { 
      ...a, 
      id: appointmentId,
      bookedById: state.currentUser?.id
    };

    // Verificar se o consultor tem Google vinculado para "empurrar" o evento para o Google
    const consultantUser = state.users.find(u => u.consultantId === a.consultantId || u.email === state.consultants.find(c => c.id === a.consultantId)?.email);
    
    let updatedGoogleEvents = [...state.googleEvents];
    if (consultantUser?.googleConnected) {
      const newGoogleEvent: GoogleEvent = {
        id: `g-push-${appointmentId}`,
        consultantId: a.consultantId,
        title: `[TrainerScheduler] ${a.clientName}`,
        start: new Date(a.start),
        end: new Date(a.end),
      };
      updatedGoogleEvents.push(newGoogleEvent);
    }

    save({ 
      appointments: [...state.appointments, newA],
      googleEvents: updatedGoogleEvents
    });
  };

  const removeAppointment = (id: string) => {
    const updated = state.appointments.filter(a => a.id !== id);
    // Também remover o evento espelhado do Google se existir
    const updatedGoogleEvents = state.googleEvents.filter(ge => ge.id !== `g-push-${id}`);
    save({ 
      appointments: updated,
      googleEvents: updatedGoogleEvents
    });
  };

  const connectGoogle = (userId: string) => {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;

    const mockEvents: GoogleEvent[] = [];
    const targetConsultantId = user.consultantId || state.consultants.find(c => c.email === user.email)?.id;
    
    if (targetConsultantId) {
      for (let week = 0; week < 4; week++) {
        const weekStart = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), week);
        
        mockEvents.push({
          id: `g-${week}-1`,
          consultantId: targetConsultantId,
          title: "Reunião de Time (Google)",
          start: setMinutes(setHours(addDays(weekStart, 1), 9), 0),
          end: setMinutes(setHours(addDays(weekStart, 1), 11), 0),
        });

        mockEvents.push({
          id: `g-${week}-2`,
          consultantId: targetConsultantId,
          title: "Check-in Projeto (Google)",
          start: setMinutes(setHours(addDays(weekStart, 3), 14), 30),
          end: setMinutes(setHours(addDays(weekStart, 3), 16), 0),
        });
      }
    }

    const updatedUsers = state.users.map(u => 
      u.id === userId ? { ...u, googleConnected: true } : u
    );
    const updatedCurrentUser = state.currentUser?.id === userId 
      ? { ...state.currentUser, googleConnected: true } 
      : state.currentUser;
      
    save({ 
      users: updatedUsers, 
      currentUser: updatedCurrentUser,
      googleEvents: [...state.googleEvents, ...mockEvents]
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
