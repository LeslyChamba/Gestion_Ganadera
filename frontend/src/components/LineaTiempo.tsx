import { Fragment, useState } from 'react';
import { useLineaTiempo } from '../api/hooks';
import type { EventoLinea, TipoEvento } from '../api/tipos';
import { TIPO_EVENTO_ETIQUETA, TIPOS_EVENTO } from '../lib/etiquetas';
import { claveMes, mesYAnio } from '../lib/formato';
import { useAlEntrarEnPantalla } from '../lib/hooks';
import { Aviso } from './Aviso';
import { EventoItem } from './EventoLinea';

/** Historial del animal, del más reciente al más antiguo, con filtro por tipo y carga por páginas. */
export function LineaTiempo({ animalId }: { animalId: string }) {
  const [tipos, setTipos] = useState<TipoEvento[]>([]);
  const consulta = useLineaTiempo(animalId, tipos);
  const { data, isPending, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } = consulta;

  const centinela = useAlEntrarEnPantalla<HTMLDivElement>(
    () => void fetchNextPage(),
    !!hasNextPage && !isFetchingNextPage,
  );

  const alternar = (t: TipoEvento) =>
    setTipos((actual) => (actual.includes(t) ? actual.filter((x) => x !== t) : [...actual, t]));

  const eventos = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <section aria-labelledby="titulo-historial" className="historial">
      <h2 id="titulo-historial">Historial</h2>

      <div className="filtros" role="group" aria-label="Filtrar por tipo de evento">
        <button type="button" className="chip" aria-pressed={tipos.length === 0} onClick={() => setTipos([])}>
          Todo
        </button>
        {TIPOS_EVENTO.map((t) => (
          <button key={t} type="button" className="chip" aria-pressed={tipos.includes(t)} onClick={() => alternar(t)}>
            {TIPO_EVENTO_ETIQUETA[t]}
          </button>
        ))}
      </div>

      {isPending && <p className="cargando">Cargando historial…</p>}

      {isError && (
        <Aviso titulo="No se pudo cargar el historial">
          {error.message}{' '}
          <button type="button" className="enlace" onClick={() => void consulta.refetch()}>
            Reintentar
          </button>
        </Aviso>
      )}

      {data && eventos.length === 0 && (
        <Aviso tipo="info" titulo={tipos.length ? 'No hay eventos de ese tipo' : 'Este animal aún no tiene eventos'}>
          {tipos.length
            ? 'Quita el filtro para ver el resto del historial.'
            : 'Cuando se registren chequeos, celos, servicios o tratamientos aparecerán aquí.'}
        </Aviso>
      )}

      {eventos.length > 0 && (
        <ol className="linea">
          {eventos.map((e, i) => {
            const nuevoMes = i === 0 || claveMes(e.fechaHora) !== claveMes(eventos[i - 1].fechaHora);
            return <FragmentoEvento key={e.id} e={e} mes={nuevoMes ? mesYAnio(e.fechaHora) : null} />;
          })}
        </ol>
      )}

      {hasNextPage && (
        <div ref={centinela} className="mas">
          <button
            type="button"
            className="boton boton-secundario"
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            {isFetchingNextPage ? 'Cargando…' : 'Ver eventos anteriores'}
          </button>
        </div>
      )}
    </section>
  );
}

function FragmentoEvento({ e, mes }: { e: EventoLinea; mes: string | null }) {
  return (
    <Fragment>
      {mes && (
        <li className="linea-mes">
          <p>{mes}</p>
        </li>
      )}
      <EventoItem evento={e} />
    </Fragment>
  );
}
