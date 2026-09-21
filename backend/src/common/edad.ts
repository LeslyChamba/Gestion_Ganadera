export interface Edad {
  meses: number;
  texto: string;
}

/** Calcula la edad a partir de una fecha 'YYYY-MM-DD'. Devuelve null si no hay fecha. */
export function calcularEdad(fechaNacimiento: string | null | undefined, hoy = new Date()): Edad | null {
  if (!fechaNacimiento) return null;
  const [y, m, d] = fechaNacimiento.split('-').map(Number);
  if (!y || !m || !d) return null;

  let meses = (hoy.getFullYear() - y) * 12 + (hoy.getMonth() + 1 - m);
  if (hoy.getDate() < d) meses -= 1; // aún no cumple el mes
  if (meses < 0) return null;

  const anios = Math.floor(meses / 12);
  const resto = meses % 12;
  const partes: string[] = [];
  if (anios > 0) partes.push(`${anios} ${anios === 1 ? 'año' : 'años'}`);
  if (resto > 0 || anios === 0) partes.push(`${resto} ${resto === 1 ? 'mes' : 'meses'}`);
  return { meses, texto: partes.join(' ') };
}
