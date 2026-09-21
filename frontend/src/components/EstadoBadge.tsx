import { Baby, Circle, CircleDashed, Heart, Milk, Syringe, type LucideIcon } from 'lucide-react';
import type { EstadoReproductivo } from '../api/tipos';
import { ESTADO_ETIQUETA } from '../lib/etiquetas';

// Cada estado lleva color, ícono y texto: nunca depende solo del color.
const ICONOS: Record<EstadoReproductivo, LucideIcon> = {
  SIN_DATOS: CircleDashed,
  VACIA: Circle,
  EN_CELO: Heart,
  SERVIDA: Syringe,
  PRENADA: Baby,
  POSPARTO: Milk,
};

export function EstadoBadge({ estado, grande = false }: { estado: EstadoReproductivo; grande?: boolean }) {
  const Icono = ICONOS[estado];
  return (
    <span className={`estado${grande ? ' estado-grande' : ''}`} data-estado={estado}>
      <Icono size={grande ? 22 : 16} aria-hidden="true" strokeWidth={2.25} />
      {ESTADO_ETIQUETA[estado]}
    </span>
  );
}
