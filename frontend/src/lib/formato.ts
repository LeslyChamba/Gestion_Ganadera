const ES = 'es-EC';

/** Interpreta 'YYYY-MM-DD' como fecha local (evita el desfase de un día por zona horaria). */
export function fechaLocal(iso: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(iso);
}

export const fechaLarga = (iso: string) =>
  new Intl.DateTimeFormat(ES, { day: 'numeric', month: 'long', year: 'numeric' }).format(fechaLocal(iso));

export const fechaCorta = (iso: string) =>
  new Intl.DateTimeFormat(ES, { day: 'numeric', month: 'short', year: 'numeric' }).format(fechaLocal(iso));

export const fechaHora = (iso: string) =>
  new Intl.DateTimeFormat(ES, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

export const mesYAnio = (iso: string) => {
  const t = new Intl.DateTimeFormat(ES, { month: 'long', year: 'numeric' }).format(new Date(iso));
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** Clave para agrupar por mes (en hora local): '2026-09' */
export const claveMes = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const inicioDelDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** "hoy", "ayer", "hace 9 días", "hace 3 meses", "dentro de 8 meses"... */
export function tiempoRelativo(iso: string, ahora: Date = new Date()): string {
  const dias = Math.round((inicioDelDia(fechaLocal(iso)).getTime() - inicioDelDia(ahora).getTime()) / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat(ES, { numeric: 'auto' });
  const abs = Math.abs(dias);
  if (abs < 60) return rtf.format(dias, 'day'); // en reproducción los días importan
  if (abs < 365) return rtf.format(Math.round(dias / 30.4), 'month');
  return rtf.format(Math.round(dias / 365.25), 'year');
}

/** 12.5 -> "12,5"; 22 -> "22" */
export const numero = (n: number) => n.toLocaleString(ES, { maximumFractionDigits: 1 });

/** [12.5, 9] -> "12,5 y 9"; [7, 9, 12] -> "7, 9 y 12" */
export function listaNumeros(valores: number[]): string {
  const t = valores.map(numero);
  if (t.length <= 1) return t.join('');
  return `${t.slice(0, -1).join(', ')} y ${t[t.length - 1]}`;
}

export const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
