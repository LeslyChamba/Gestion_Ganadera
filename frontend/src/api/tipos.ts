export type EstadoReproductivo = 'SIN_DATOS' | 'VACIA' | 'EN_CELO' | 'SERVIDA' | 'PRENADA' | 'POSPARTO';

export interface Hacienda {
  id: string;
  nombre: string;
  ubicacion: string | null;
}
export interface Lote {
  id: string;
  haciendaId: string;
  nombre: string;
}
export interface Raza {
  id: string;
  nombre: string;
}

/** Fila del buscador */
export interface ResultadoBusqueda {
  id: string;
  arete: string;
  codigo: string | null;
  nombre: string | null;
  estadoReproductivo: EstadoReproductivo;
  lote: string | null;
  raza: string | null;
}

export interface Edad {
  meses: number;
  texto: string;
}

export interface ResumenReproductivo {
  ultimoChequeo: string | null;
  ultimoCelo: string | null;
  ultimoServicio: {
    fechaHora: string;
    tipo: 'IA' | 'MONTA';
    toro: string | null;
    codigoPajuela: string | null;
  } | null;
  ultimoDiagnostico: {
    fechaHora: string;
    resultado: 'PRENADA' | 'VACIA' | 'DUDOSA';
    fechaProbableParto: string | null;
  } | null;
}

export interface Ficha {
  id: string;
  arete: string;
  codigo: string | null;
  nombre: string | null;
  fechaNacimiento: string | null;
  edad: Edad | null;
  hacienda: { id: string; nombre: string };
  lote: { id: string; nombre: string } | null;
  raza: { id: string; nombre: string } | null;
  madreId: string | null;
  estadoReproductivo: EstadoReproductivo;
  estadoActualizadoAt: string;
  activo: boolean;
  observaciones: string | null;
  resumenReproductivo: ResumenReproductivo;
}

export interface AnimalPayload {
  haciendaId?: string;
  arete?: string;
  codigo?: string | null;
  nombre?: string | null;
  razaId?: string | null;
  loteId?: string | null;
  fechaNacimiento?: string | null;
  observaciones?: string | null;
}

// ---------------------------------------------------------------- Línea de tiempo
export type TipoEvento = 'CHEQUEO' | 'CELO' | 'SERVICIO' | 'DIAGNOSTICO' | 'TRATAMIENTO';

export interface HallazgoOvario {
  lado: 'IZQUIERDO' | 'DERECHO';
  foliculosMm: number[];
  clPresente: boolean;
  clEstado: 'EN_FORMACION' | 'FUNCIONAL' | 'REGRESION' | null;
  clDiametroMm: number | null;
  observaciones: string | null;
}

interface EventoBase {
  id: string;
  fechaHora: string;
}

export type EventoLinea =
  | (EventoBase & {
      tipo: 'CHEQUEO';
      detalle: { observaciones: string | null; veterinario: string | null; ovarios: HallazgoOvario[] };
    })
  | (EventoBase & {
      tipo: 'CELO';
      detalle: { observaciones: string | null; detectadoPor: string | null };
    })
  | (EventoBase & {
      tipo: 'SERVICIO';
      detalle: {
        tipo: 'IA' | 'MONTA';
        toro: string | null;
        codigoPajuela: string | null;
        inseminador: string | null;
        observaciones: string | null;
      };
    })
  | (EventoBase & {
      tipo: 'DIAGNOSTICO';
      detalle: {
        metodo: 'PALPACION' | 'ECOGRAFIA';
        resultado: 'PRENADA' | 'VACIA' | 'DUDOSA';
        diasGestacion: number | null;
        fechaProbableParto: string | null;
        veterinario: string | null;
        observaciones: string | null;
      };
    })
  | (EventoBase & {
      tipo: 'TRATAMIENTO';
      detalle: {
        tipo: 'HORMONAL' | 'MEDICO';
        producto: string;
        dosis: string | null;
        via: string | null;
        protocolo: string | null;
        responsable: string | null;
        observaciones: string | null;
      };
    });

export interface PaginaLinea {
  items: EventoLinea[];
  nextCursor: string | null;
}
