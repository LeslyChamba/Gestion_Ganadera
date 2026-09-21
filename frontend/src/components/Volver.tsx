import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/** Vuelve a la pantalla anterior (conserva la búsqueda) o, si no hay historial, al buscador. */
export function Volver({ etiqueta = 'Volver' }: { etiqueta?: string }) {
  const navegar = useNavigate();
  const hayAnterior = (window.history.state?.idx ?? 0) > 0;
  return (
    <button type="button" className="volver" onClick={() => (hayAnterior ? navegar(-1) : navegar('/'))}>
      <ChevronLeft size={20} aria-hidden="true" />
      {etiqueta}
    </button>
  );
}
