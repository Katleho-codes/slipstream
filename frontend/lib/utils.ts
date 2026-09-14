import clsx, { ClassValue } from 'clsx';

export function cx(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const SAST = 'Africa/Johannesburg';

export function fmtCurrency(n: number): string {
  return `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-ZA', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: SAST,
  });
}

export function fmtDateShort(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: SAST,
  });
}

export function fmtTime(d: string | Date): string {
  return new Date(d).toLocaleTimeString('en-ZA', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: SAST,
  });
}

export function fmtDateTime(d: string | Date): string {
  return `${fmtDateShort(d)}, ${fmtTime(d)}`;
}

export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Re-export plan constants from the shared plans module for backwards compatibility
export { PLAN_LIMITS, PLAN_PRICE } from './plans';