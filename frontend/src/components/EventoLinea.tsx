import { BadgeCheck, Heart, Pill, Stethoscope, Syringe, type LucideIcon } from 'lucide-react';
import type { EventoLinea, HallazgoOvario, TipoEvento } from '../api/tipos';
import { ESTADO_CL, METODO_DIAGNOSTICO, RESULTADO_DIAGNOSTICO } from '../lib/etiquetas';
import { fechaCorta, fechaHora, listaNumeros, numero, tiempoRelativo } from '../lib/formato';

const ICONOS: Record<TipoEvento, LucideIcon> = {
  CHEQUEO: Stethoscope,
  CELO: Heart,
  SERVICIO: Syringe,
  DIAGNOSTICO: BadgeCheck,
  TRATAMIENTO: Pill,
};

function titulo(e: EventoLinea): string {
  switch (e.tipo) {
    case 'CHEQUEO':
      return 'Chequeo ginecológico';
    case 'CELO':
      return 'Celo';
    case 'SERVICIO':
      return e.detalle.tipo === 'IA' ? 'Inseminación artificial' : 'Monta natural';
    case 'DIAGNOSTICO':
      return `Diagnóstico de preñez: ${RESULTADO_DIAGNOSTICO[e.detalle.resultado]}`;
    case 'TRATAMIENTO':
      return e.detalle.tipo === 'HORMONAL' ? 'Tratamiento hormonal' : 'Tratamiento médico';
  }
}

/** Pares etiqueta-valor; se omiten los que no tienen dato. */
function Datos({ filas }: { filas: [string, string | null | undefined][] }) {
  const visibles = filas.filter(([, v]) => v);
  if (visibles.length === 0) return null;
  return (
    <dl className="datos">
      {visibles.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function textoFoliculos(mm: number[]): string {
  if (mm.length === 0) return 'Sin folículos medidos';
  if (mm.length === 1) return `Folículo de ${numero(mm[0])} mm`;
  return `Folículos de ${listaNumeros(mm)} mm`;
}

function textoCuerpoLuteo(o: HallazgoOvario): string {
  if (!o.clPresente) return 'Sin cuerpo lúteo';
  const partes = ['Cuerpo lúteo'];
  if (o.clEstado) partes.push(ESTADO_CL[o.clEstado]);
  const base = partes.join(' ');
  return o.clDiametroMm ? `${base}, ${numero(o.clDiametroMm)} mm` : base;
}

function Ovario({ o }: { o: HallazgoOvario }) {
  return (
    <div className="ovario">
      <h4>{o.lado === 'IZQUIERDO' ? 'Ovario izquierdo' : 'Ovario derecho'}</h4>
      <p>{textoFoliculos(o.foliculosMm)}</p>
      <p>{textoCuerpoLuteo(o)}</p>
      {o.observaciones && <p className="nota">{o.observaciones}</p>}
    </div>
  );
}

function Detalle({ e }: { e: EventoLinea }) {
  switch (e.tipo) {
    case 'CHEQUEO': {
      const { ovarios, observaciones, veterinario } = e.detalle;
      return (
        <>
          {ovarios.length > 0 ? (
            <div className="ovarios">
              {ovarios.map((o) => (
                <Ovario key={o.lado} o={o} />
              ))}
            </div>
          ) : (
            <p className="nota">Sin hallazgos por ovario registrados.</p>
          )}
          {observaciones && <p className="nota">{observaciones}</p>}
          <Datos filas={[['Revisó', veterinario]]} />
        </>
      );
    }
    case 'CELO':
      return (
        <>
          <p className="nota">{e.detalle.observaciones ?? 'Sin observaciones.'}</p>
          <Datos filas={[['Detectado por', e.detalle.detectadoPor]]} />
        </>
      );
    case 'SERVICIO': {
      const d = e.detalle;
      return (
        <>
          <Datos
            filas={[
              ['Toro', d.toro],
              ['Pajuela', d.codigoPajuela],
              [d.tipo === 'IA' ? 'Inseminador' : 'Responsable', d.inseminador],
            ]}
          />
          {d.observaciones && <p className="nota">{d.observaciones}</p>}
        </>
      );
    }
    case 'DIAGNOSTICO': {
      const d = e.detalle;
      return (
        <>
          <Datos
            filas={[
              ['Método', METODO_DIAGNOSTICO[d.metodo]],
              ['Gestación', d.diasGestacion != null ? `${d.diasGestacion} días` : null],
              [
                'Parto probable',
                d.fechaProbableParto ? `${fechaCorta(d.fechaProbableParto)} (${tiempoRelativo(d.fechaProbableParto)})` : null,
              ],
              ['Revisó', d.veterinario],
            ]}
          />
          {d.observaciones && <p className="nota">{d.observaciones}</p>}
        </>
      );
    }
    case 'TRATAMIENTO': {
      const d = e.detalle;
      return (
        <>
          <Datos
            filas={[
              ['Producto', d.producto],
              ['Dosis', d.dosis],
              ['Vía', d.via],
              ['Protocolo', d.protocolo],
              ['Aplicó', d.responsable],
            ]}
          />
          {d.observaciones && <p className="nota">{d.observaciones}</p>}
        </>
      );
    }
  }
}

export function EventoItem({ evento }: { evento: EventoLinea }) {
  const Icono = ICONOS[evento.tipo];
  return (
    <li className="evento" data-tipo={evento.tipo}>
      <span className="evento-nodo" aria-hidden="true">
        <Icono size={18} strokeWidth={2.25} />
      </span>
      <article className="evento-cuerpo">
        <header className="evento-cabecera">
          <h3>{titulo(evento)}</h3>
          <p className="evento-fecha">
            <time dateTime={evento.fechaHora}>{fechaHora(evento.fechaHora)}</time>
            <span className="evento-hace">{tiempoRelativo(evento.fechaHora)}</span>
          </p>
        </header>
        <Detalle e={evento} />
      </article>
    </li>
  );
}
