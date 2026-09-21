import { Link } from 'react-router-dom';
import { useHacienda } from '../hacienda/HaciendaContext';

export function Cabecera() {
  const { haciendas, hacienda, elegir } = useHacienda();

  return (
    <header className="cabecera">
      <div className="cabecera-interior">
        <Link to="/" className="marca">
          <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
            <rect x="6" y="14" width="52" height="36" rx="10" fill="#F5C518" stroke="#B88F00" strokeWidth="3" />
            <circle cx="19" cy="32" r="5" fill="#0E5A6B" />
          </svg>
          Historial reproductivo
        </Link>

        {haciendas.length > 0 && (
          <label className="cabecera-hacienda">
            <span className="visualmente-oculto">Hacienda</span>
            <select value={hacienda?.id ?? ''} onChange={(e) => elegir(e.target.value)}>
              {!hacienda && (
                <option value="" disabled>
                  Elige una hacienda
                </option>
              )}
              {haciendas.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </header>
  );
}
