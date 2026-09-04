import { clsx, type ClassValue } from 'clsx';
import { format, startOfWeek, addDays } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getWeekDates(weekStart: Date): Date[] {
  const monday = startOfWeek(weekStart, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function getMondayOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatMinutes(mins: number | null | undefined): string {
  if (!mins) return '—';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { error?: string; errors?: { msg: string }[] } } };
    const data = axiosError.response?.data;
    if (data?.error) return data.error;
    if (data?.errors?.length) return data.errors[0].msg;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
