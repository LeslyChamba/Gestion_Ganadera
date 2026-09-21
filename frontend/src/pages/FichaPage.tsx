import { Pencil } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useFicha } from '../api/hooks';
import { ApiError } from '../api/client';
import { AretePlaca } from '../components/AretePlaca';
import { Aviso } from '../components/Aviso';
import { EstadoBadge } from '../components/EstadoBadge';
import { LineaTiempo } from '../components/LineaTiempo';
import { ResumenReproductivo } from '../components/ResumenReproductivo';
import { Volver } from '../components/Volver';
import { tiempoRelativo } from '../lib/formato';

export function FichaPage() {
  const { id } = useParams();
  const { data: f, isPending, isError, error, refetch } = useFicha(id);

  if (isPending) return <p className="cargando">Cargando ficha…</p>;

  if (isError) {
    const noExiste = error instanceof ApiError && (error.status === 404 || error.status === 400);
    return (
      <>
        <Volver />
        <Aviso titulo={noExiste ? 'No encontramos este animal' : 'No se pudo cargar la ficha'}>
          {noExiste ? 'Puede que el enlace sea incorrecto.' : error.message}{' '}
          {!noExiste && (
            <button type="button" className="enlace" onClick={() => void refetch()}>
              Reintentar
            </button>
          )}
        </Aviso>
      </>
    );
  }

  const datos: [string, string][] = [
    ['Edad', f.edad?.texto ?? 'Sin fecha de nacimiento'],
    ['Raza', f.raza?.nombre ?? 'Sin especificar'],
    ['Lote', f.lote?.nombre ?? 'Sin lote'],
    ['Hacienda', f.hacienda.nombre],
  ];

  return (
    <article>
      <div className="barra-ficha">
        <Volver />
        <Link to={`/animales/${f.id}/editar`} className="boton boton-secundario">
          <Pencil size={18} aria-hidden="true" />
          Editar ficha
        </Link>
      </div>

      {!f.activo && (
        <Aviso tipo="info" titulo="Este animal está dado de baja">
          Ya no aparece en el buscador, pero su historial se conserva.
        </Aviso>
      )}

      <header className="ficha-cabecera">
        <AretePlaca numero={f.arete} tamano="lg" />
        <div className="ficha-identidad">
          <h1>{f.nombre ?? 'Sin nombre'}</h1>
          {f.codigo && <p className="ficha-codigo">Código {f.codigo}</p>}
        </div>
        <div className="ficha-estado">
          <EstadoBadge estado={f.estadoReproductivo} grande />
          {f.estadoReproductivo !== 'SIN_DATOS' && (
            <p className="ficha-desde">Desde {tiempoRelativo(f.estadoActualizadoAt)}</p>
          )}
        </div>
      </header>

      <dl className="ficha-datos">
        {datos.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      {f.observaciones && <p className="nota nota-ficha">{f.observaciones}</p>}

      <ResumenReproductivo resumen={f.resumenReproductivo} estado={f.estadoReproductivo} />
      <LineaTiempo animalId={f.id} />
    </article>
  );
}
