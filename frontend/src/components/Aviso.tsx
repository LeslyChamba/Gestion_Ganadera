import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

/** Mensaje de error o estado vacío: dice qué pasó y qué hacer. */
export function Aviso({
  titulo,
  children,
  tipo = 'error',
}: {
  titulo: string;
  children?: ReactNode;
  tipo?: 'error' | 'info';
}) {
  return (
    <div className={`aviso aviso-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      {tipo === 'error' && <CircleAlert size={22} aria-hidden="true" />}
      <div>
        <p className="aviso-titulo">{titulo}</p>
        {children && <div className="aviso-texto">{children}</div>}
      </div>
    </div>
  );
}
