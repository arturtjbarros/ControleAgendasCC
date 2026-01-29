
export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export type UserRole = 'ADMIN' | 'TRAINER' | 'SALES' | 'CS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  googleConnected?: boolean;
  googleAccessToken?: string;
  lastSync?: string;
  consultantId?: string; // Links user to a consultant profile if role is TRAINER
}

export interface GoogleEvent {
  id: string;
  consultantId: string;
  title: string;
  start: Date;
  end: Date;
}

export interface Consultant {
  id: string;
  name: string;
  email: string;
  role: string;
  color: string;
  workStart: string; // HH:mm
  workEnd: string;   // HH:mm
  workDays: number[]; // 0-6 (Sunday to Saturday)
  userId?: string;
}

export interface Appointment {
  id: string;
  consultantId: string;
  clientName: string;
  title: string;
  start: Date;
  end: Date;
  status: AppointmentStatus;
  bookedById?: string; // ID of the Sales/CS user who made the booking
}

export interface TimeBlock {
  id: string;
  consultantId: string;
  start: Date;
  end: Date;
  reason: string;
}

export type ViewType = 'dashboard' | 'calendar' | 'team' | 'appointments' | 'profile';
