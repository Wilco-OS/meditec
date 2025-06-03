import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Kombiniert Tailwind-Klassen mit clsx und twMerge für saubere Klassen-Kombination
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatiert ein Datum in deutsches Format
 */
export function formatDate(date: Date | string | undefined, includeTime = false): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  
  if (includeTime) {
    return dateObj.toLocaleString('de-DE', {
      ...options,
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return dateObj.toLocaleDateString('de-DE', options);
}

/**
 * Erstellt einen zufälligen alphanumerischen Code
 */
export function generateRandomCode(length = 6): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Prüft, ob eine E-Mail-Adresse zu Meditec gehört
 */
export function isMeditecEmail(email: string): boolean {
  return email.toLowerCase().endsWith('@meditec-online.com');
}

/**
 * Generiert eine Kurzform eines UUID
 */
export function shortId(): string {
  return Math.random().toString(36).substring(2, 10);
}
