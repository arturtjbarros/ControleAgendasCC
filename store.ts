
import { useState, useEffect } from 'react';
import { Consultant, Appointment, TimeBlock, User, UserRole, GoogleEvent } from './types';
import { INITIAL_CONSULTANTS } from './constants';
import { setHours, setMinutes, addDays, startOfWeek, addWeeks, subDays } from 'date-fns';

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
    // Check for double bookings again at store level for safety
    const isConflict = checkConflict(a.consultantId, a.start, a.end);
    if (isConflict) {
      alert("Erro: Este horário já está ocupado (Interno ou Google Calendar).");
      return;
    }

    const newA = { 
      ...a, 
      id: Math.random().toString(36).substr(2, 9),
      bookedById: state.currentUser?.id
    };
    save({ appointments: [...state.appointments, newA] });
  };

  const checkConflict = (consultantId: string, start: Date, end: Date) => {
    const hasInternal = state.appointments.some(app => 
      app.consultantId === consultantId && 
      ((start < app.end && end > app.start))
    );
    const hasExternal = state.googleEvents.some(evt => 
      evt.consultantId === consultantId && 
      ((start < evt.end && end > evt.start))
    );
    return hasInternal || hasExternal;
  };

  const removeAppointment = (id: string) => {
    const updated = state.appointments.filter(a => a.id !== id);
    save({ appointments: updated });
  };

  const connectGoogle = async (userId: string, accessToken?: string) => {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;

    // In a real environment, we would fetch from Google Calendar API here.
    // We will simulate the fetch if no real API token is provided, or provide a way to use the real token.
    let fetchedEvents: GoogleEvent[] = [];
    
    let targetConsultantId = user.consultantId || state.consultants.find(c => c.email === user.email)?.id;
    if (!targetConsultantId && user.role === 'ADMIN' && state.consultants.length > 0) {
      targetConsultantId = state.consultants[0].id;
    }

    if (targetConsultantId) {
      if (accessToken) {
        // ACTUAL API CALL ATTEMPT (Requires valid OAuth Token)
        try {
          const timeMin = subDays(new Date(), 7).toISOString();
          const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&singleEvents=true&orderBy=startTime`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          if (response.ok) {
            const data = await response.json();
            fetchedEvents = data.items
              .filter((item: any) => item.start?.dateTime && item.end?.dateTime)
              .map((item: any) => ({
                id: item.id,
                consultantId: targetConsultantId!,
                title: item.summary || "Evento Google",
                start: new Date(item.start.dateTime),
                end: new Date(item.end.dateTime),
              }));
          }
        } catch (e) {
          console.error("Failed to fetch real Google events, falling back to mock for demo", e);
        }
      }

      // If fetching failed or no token, generate high-quality mocks for testing
      if (fetchedEvents.length === 0) {
        for (let week = 0; week < 4; week++) {
          const weekStart = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), week);
          mockEvents.push({
            id: `g-${week}-tue-${targetConsultantId}`,
            consultantId: targetConsultantId,
            title: "Reunião de Alinhamento (Google)",
            start: setMinutes(setHours(addDays(weekStart, 1), 9), 0),
            end: setMinutes(setHours(addDays(weekStart, 1), 11), 0),
          });
          mockEvents.push({
            id: `g-${week}-thu-${targetConsultantId}`,
            consultantId: targetConsultantId,
            title: "Compromisso Externo (Google)",
            start: setMinutes(setHours(addDays(weekStart, 3), 15), 0),
            end: setMinutes(setHours(addDays(weekStart, 3), 16), 30),
          });
        }
        fetchedEvents = mockEvents;
      }

      const filteredEvents = state.googleEvents.filter(e => e.consultantId !== targetConsultantId);
      
      const updatedUsers = state.users.map(u => 
        u.id === userId ? { ...u, googleConnected: true, googleAccessToken: accessToken, lastSync: new Date().toISOString() } : u
      );
      const updatedCurrentUser = state.currentUser?.id === userId 
        ? { ...state.currentUser, googleConnected: true, googleAccessToken: accessToken, lastSync: new Date().toISOString() } 
        : state.currentUser;
        
      save({ 
        users: updatedUsers, 
        currentUser: updatedCurrentUser,
        googleEvents: [...filteredEvents, ...fetchedEvents]
      });
    }
  };

  const mockEvents: GoogleEvent[] = [];

  const disconnectGoogle = (userId: string) => {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;
    
    const targetConsultantId = user.consultantId || state.consultants.find(c => c.email === user.email)?.id;
    const filteredEvents = targetConsultantId 
      ? state.googleEvents.filter(e => e.consultantId !== targetConsultantId)
      : state.googleEvents;

    const updatedUsers = state.users.map(u => 
      u.id === userId ? { ...u, googleConnected: false, googleAccessToken: undefined } : u
    );
    const updatedCurrentUser = state.currentUser?.id === userId 
      ? { ...state.currentUser, googleConnected: false, googleAccessToken: undefined } 
      : state.currentUser;

    save({ 
      users: updatedUsers, 
      currentUser: updatedCurrentUser,
      googleEvents: filteredEvents
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
    disconnectGoogle,
  };
};
