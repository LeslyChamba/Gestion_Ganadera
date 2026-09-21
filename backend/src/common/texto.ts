/**
 * Normaliza texto para búsquedas: minúsculas, sin tildes ni ñ, espacios simples.
 * Debe coincidir con la columna animales.busqueda (lower + unaccent).
 */
export function normalizarBusqueda(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Escapa los comodines de LIKE (% _ \) para que se busquen como texto literal. */
export function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, '\\$&');
}
