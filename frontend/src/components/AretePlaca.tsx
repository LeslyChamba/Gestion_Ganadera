/**
 * El arete como en el corral: una placa amarilla con su ojal.
 * Es lo primero que se lee de cada vaca, por eso es el elemento visual principal del sistema.
 */
export function AretePlaca({ numero, tamano = 'md' }: { numero: string; tamano?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`placa placa-${tamano}`} role="img" aria-label={`Arete ${numero}`}>
      <span className="placa-ojal" aria-hidden="true" />
      <span className="placa-numero" aria-hidden="true">
        {numero}
      </span>
    </span>
  );
}
