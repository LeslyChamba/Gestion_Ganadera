import type { EstadoReproductivo, TipoEvento } from '../api/tipos';

export const ESTADO_ETIQUETA: Record<EstadoReproductivo, string> = {
  SIN_DATOS: 'Sin datos',
  VACIA: 'Vacía',
  EN_CELO: 'En celo',
  SERVIDA: 'Servida',
  PRENADA: 'Preñada',
  POSPARTO: 'Posparto',
};

export const TIPO_EVENTO_ETIQUETA: Record<TipoEvento, string> = {
  CHEQUEO: 'Chequeos',
  CELO: 'Celos',
  SERVICIO: 'Servicios',
  DIAGNOSTICO: 'Diagnósticos',
  TRATAMIENTO: 'Tratamientos',
};

export const TIPOS_EVENTO: TipoEvento[] = ['CHEQUEO', 'CELO', 'SERVICIO', 'DIAGNOSTICO', 'TRATAMIENTO'];

export const RESULTADO_DIAGNOSTICO: Record<'PRENADA' | 'VACIA' | 'DUDOSA', string> = {
  PRENADA: 'preñada',
  VACIA: 'vacía',
  DUDOSA: 'dudoso',
};

export const METODO_DIAGNOSTICO: Record<'PALPACION' | 'ECOGRAFIA', string> = {
  PALPACION: 'Palpación',
  ECOGRAFIA: 'Ecografía',
};

export const ESTADO_CL: Record<'EN_FORMACION' | 'FUNCIONAL' | 'REGRESION', string> = {
  EN_FORMACION: 'en formación',
  FUNCIONAL: 'funcional',
  REGRESION: 'en regresión',
};
