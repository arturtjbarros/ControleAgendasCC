
import { Consultant, AppointmentStatus } from './types';

export const COLORS = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#f97316', // Orange
];

export const INITIAL_CONSULTANTS: Consultant[] = [
  {
    id: '1',
    name: 'Alex Silva',
    email: 'alex@trainer.com',
    role: 'Senior Consultant',
    color: COLORS[0],
    workStart: '08:00',
    workEnd: '17:00',
    workDays: [1, 2, 3, 4, 5],
  },
  {
    id: '2',
    name: 'Beatriz Costa',
    email: 'beatriz@trainer.com',
    role: 'Product Specialist',
    color: COLORS[1],
    workStart: '09:00',
    workEnd: '18:00',
    workDays: [1, 2, 3, 4, 5],
  }
];

export const BUSINESS_HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00 to 18:00
