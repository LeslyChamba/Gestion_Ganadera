import { Baby } from 'lucide-react';
import type { EstadoReproductivo, ResumenReproductivo as Resumen } from '../api/tipos';
import { RESULTADO_DIAGNOSTICO } from '../lib/etiquetas';
import { fechaCorta, fechaLarga, tiempoRelativo } from '../lib/formato';

function Dato({ etiqueta, valor, detalle }: { etiqueta: string; valor: string; detalle?: string | null }) {
  return (
    <div className="resumen-dato">
      <dt>{etiqueta}</dt>
      <dd className="resumen-valor">{valor}</dd>
      {detalle && <dd className="resumen-detalle">{detalle}</dd>}
    </div>
  );
}

/** Lo que se necesita saber antes de tocar a la vaca: qué pasó por última vez y qué se espera. */
export function ResumenReproductivo({ resumen, estado }: { resumen: Resumen; estado: EstadoReproductivo }) {
  const { ultimoChequeo, ultimoCelo, ultimoServicio, ultimoDiagnostico } = resumen;
  const parto =
    estado === 'PRENADA' && ultimoDiagnostico?.resultado === 'PRENADA' ? ultimoDiagnostico.fechaProbableParto : null;

  return (
    <section aria-labelledby="titulo-resumen" className="resumen">
      <h2 id="titulo-resumen">Situación reproductiva</h2>

      {parto && (
        <p className="parto">
          <Baby size={24} aria-hidden="true" />
          <span>
            Parto probable el <strong>{fechaLarga(parto)}</strong>, {tiempoRelativo(parto)}.
          </span>
        </p>
      )}

      <dl className="resumen-rejilla">
        <Dato
          etiqueta="Último chequeo"
          valor={ultimoChequeo ? fechaCorta(ultimoChequeo) : 'Sin chequeos'}
          detalle={ultimoChequeo ? tiempoRelativo(ultimoChequeo) : null}
        />
        <Dato
          etiqueta="Último celo"
          valor={ultimoCelo ? fechaCorta(ultimoCelo) : 'Sin celos registrados'}
          detalle={ultimoCelo ? tiempoRelativo(ultimoCelo) : null}
        />
        <Dato
          etiqueta="Último servicio"
          valor={
            ultimoServicio
              ? `${ultimoServicio.tipo === 'IA' ? 'Inseminación' : 'Monta natural'}, ${fechaCorta(ultimoServicio.fechaHora)}`
              : 'Sin servicios'
          }
          detalle={
            ultimoServicio
              ? [ultimoServicio.toro, ultimoServicio.codigoPajuela && `pajuela ${ultimoServicio.codigoPajuela}`]
                  .filter(Boolean)
                  .join(', ') || tiempoRelativo(ultimoServicio.fechaHora)
              : null
          }
        />
        <Dato
          etiqueta="Último diagnóstico"
          valor={
            ultimoDiagnostico
              ? `${RESULTADO_DIAGNOSTICO[ultimoDiagnostico.resultado].replace(/^./, (c) => c.toUpperCase())}, ${fechaCorta(ultimoDiagnostico.fechaHora)}`
              : 'Sin diagnósticos'
          }
          detalle={ultimoDiagnostico ? tiempoRelativo(ultimoDiagnostico.fechaHora) : null}
        />
      </dl>
    </section>
  );
}
