export enum EstadoReproductivo {
  SIN_DATOS = 'SIN_DATOS',
  VACIA = 'VACIA',
  EN_CELO = 'EN_CELO',
  SERVIDA = 'SERVIDA',
  PRENADA = 'PRENADA',
  POSPARTO = 'POSPARTO',
}

/**
 * Transiciones permitidas entre estados reproductivos.
 * Es un punto de partida: ajústalo con el criterio del veterinario/zootecnista.
 * Lo usará el Módulo 2 cada vez que se registre un celo, servicio o diagnóstico.
 */
export const TRANSICIONES: Record<EstadoReproductivo, EstadoReproductivo[]> = {
  [EstadoReproductivo.SIN_DATOS]: Object.values(EstadoReproductivo),
  [EstadoReproductivo.VACIA]: [EstadoReproductivo.EN_CELO, EstadoReproductivo.SERVIDA],
  [EstadoReproductivo.EN_CELO]: [EstadoReproductivo.SERVIDA, EstadoReproductivo.VACIA],
  [EstadoReproductivo.SERVIDA]: [
    EstadoReproductivo.PRENADA, // diagnóstico positivo
    EstadoReproductivo.VACIA, // diagnóstico negativo
    EstadoReproductivo.EN_CELO, // repite celo
  ],
  [EstadoReproductivo.PRENADA]: [
    EstadoReproductivo.POSPARTO, // parto
    EstadoReproductivo.VACIA, // pérdida de la gestación
  ],
  [EstadoReproductivo.POSPARTO]: [
    EstadoReproductivo.EN_CELO,
    EstadoReproductivo.SERVIDA,
    EstadoReproductivo.VACIA,
  ],
};

export function puedeTransicionar(desde: EstadoReproductivo, hacia: EstadoReproductivo): boolean {
  return desde === hacia || TRANSICIONES[desde].includes(hacia);
}
