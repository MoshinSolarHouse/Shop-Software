import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPKR(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-PK');
}

export function formatDate(date: string | Date): string {
  if (!date) return '';
  const d = typeof date === 'string' ? date : date.toISOString();
  return d.slice(0, 10);
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
