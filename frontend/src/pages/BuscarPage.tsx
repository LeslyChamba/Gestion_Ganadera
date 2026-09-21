import { Plus, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MIN_CARACTERES_BUSQUEDA, useBuscar } from '../api/hooks';
import type { ResultadoBusqueda } from '../api/tipos';
import { AretePlaca } from '../components/AretePlaca';
import { Aviso } from '../components/Aviso';
import { EstadoBadge } from '../components/EstadoBadge';
import { useHacienda } from '../hacienda/HaciendaContext';
import { useDebounce } from '../lib/hooks';

function FilaResultado({ r }: { r: ResultadoBusqueda }) {
  const detalle = [r.codigo && `Código ${r.codigo}`, r.raza, r.lote].filter(Boolean).join(', ');
  return (
    <li>
      <Link to={`/animales/${r.id}`} className="resultado">
        <AretePlaca numero={r.arete} tamano="sm" />
        <span className="resultado-info">
          <span className="resultado-nombre">{r.nombre ?? 'Sin nombre'}</span>
          {detalle && <span className="resultado-detalle">{detalle}</span>}
        </span>
        <EstadoBadge estado={r.estadoReproductivo} />
      </Link>
    </li>
  );
}

export function BuscarPage() {
  const { haciendas, hacienda, cargando, error, elegir } = useHacienda();
  const [params, setParams] = useSearchParams();
  const [texto, setTexto] = useState(params.get('q') ?? '');
  const buscado = useDebounce(texto, 200);
  const entrada = useRef<HTMLInputElement>(null);
  const navegar = useNavigate();

  // La búsqueda queda en la dirección: al volver desde una ficha, sigue ahí.
  useEffect(() => {
    const q = buscado.trim();
    setParams(q ? { q } : {}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscado]);

  // Atajo "/" para ir directo al buscador (teclado).
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      const escribiendo = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement).tagName);
      if (e.key === '/' && !escribiendo) {
        e.preventDefault();
        entrada.current?.focus();
      }
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, []);

  const consulta = useBuscar(buscado, hacienda?.id);
  const termino = texto.trim();
  const resultados = consulta.data ?? [];
  const vigente = buscado.trim() === termino && !consulta.isPlaceholderData;

  if (cargando) return <p className="cargando">Cargando…</p>;

  if (error) {
    return (
      <Aviso titulo="No se pudo conectar con el servidor">
        Revisa que el servidor esté encendido y recarga la página.
      </Aviso>
    );
  }

  if (haciendas.length === 0) {
    return (
      <Aviso tipo="info" titulo="Todavía no hay haciendas">
        Registra al menos una hacienda en la base de datos para empezar a buscar animales.
      </Aviso>
    );
  }

  if (!hacienda) {
    return (
      <section>
        <h1>¿En qué hacienda estás?</h1>
        <ul className="lista-haciendas">
          {haciendas.map((h) => (
            <li key={h.id}>
              <button type="button" className="boton boton-secundario boton-ancho" onClick={() => elegir(h.id)}>
                {h.nombre}
                {h.ubicacion && <span className="boton-sub">{h.ubicacion}</span>}
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const alEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (vigente && resultados.length > 0) navegar(`/animales/${resultados[0].id}`);
  };

  return (
    <section>
      <div className="encabezado-pagina">
        <h1>Buscar animal</h1>
        <Link to="/animales/nuevo" className="boton boton-secundario">
          <Plus size={20} aria-hidden="true" />
          Nuevo animal
        </Link>
      </div>

      <form onSubmit={alEnviar} role="search" className="buscador">
        <label htmlFor="buscador" className="visualmente-oculto">
          Arete, código o nombre
        </label>
        <Search size={24} aria-hidden="true" className="buscador-icono" />
        <input
          id="buscador"
          ref={entrada}
          type="search"
          inputMode="search"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          placeholder="Arete, código o nombre"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
      </form>

      <div aria-live="polite" className="resultados">
        {termino.length === 0 && (
          <p className="ayuda">Escribe el arete, el código o el nombre. Con Enter abres el primer resultado.</p>
        )}

        {termino.length > 0 && termino.length < MIN_CARACTERES_BUSQUEDA && (
          <p className="ayuda">Escribe al menos {MIN_CARACTERES_BUSQUEDA} caracteres.</p>
        )}

        {consulta.isError && (
          <Aviso titulo="No se pudo buscar">
            {(consulta.error as Error).message}{' '}
            <button type="button" className="enlace" onClick={() => void consulta.refetch()}>
              Reintentar
            </button>
          </Aviso>
        )}

        {consulta.data && termino.length >= MIN_CARACTERES_BUSQUEDA && (
          <>
            {resultados.length > 0 && (
              <p className="ayuda">
                {resultados.length === 1 ? '1 resultado' : `${resultados.length} resultados`} en {hacienda.nombre}
              </p>
            )}
            {resultados.length > 0 && (
              <ul className="lista-resultados">
                {resultados.map((r) => (
                  <FilaResultado key={r.id} r={r} />
                ))}
              </ul>
            )}
            {vigente && resultados.length === 0 && (
              <Aviso tipo="info" titulo={`No hay animales que coincidan con «${termino}»`}>
                Revisa el arete o el nombre. Si el animal es nuevo,{' '}
                <Link to={`/animales/nuevo?arete=${encodeURIComponent(termino)}`}>créalo con el arete {termino}</Link>.
              </Aviso>
            )}
          </>
        )}
      </div>
    </section>
  );
}
