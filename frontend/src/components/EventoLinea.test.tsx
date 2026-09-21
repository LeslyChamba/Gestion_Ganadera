import { render, screen } from '@testing-library/react';
import type { EventoLinea } from '../api/tipos';
import { EventoItem } from './EventoLinea';

const chequeo: EventoLinea = {
  id: '1',
  tipo: 'CHEQUEO',
  fechaHora: '2026-06-21T10:00:00Z',
  detalle: {
    observaciones: 'Tacto previo a servicio',
    veterinario: 'Dra. Ejemplo',
    ovarios: [
      { lado: 'IZQUIERDO', foliculosMm: [12.5, 9], clPresente: true, clEstado: 'FUNCIONAL', clDiametroMm: 22, observaciones: null },
      { lado: 'DERECHO', foliculosMm: [], clPresente: false, clEstado: null, clDiametroMm: null, observaciones: null },
    ],
  },
};

describe('EventoItem', () => {
  it('muestra los hallazgos de cada ovario en lenguaje de campo', () => {
    render(<ol><EventoItem evento={chequeo} /></ol>);
    expect(screen.getByText('Chequeo ginecológico')).toBeInTheDocument();
    expect(screen.getByText('Ovario izquierdo')).toBeInTheDocument();
    expect(screen.getByText('Folículos de 12,5 y 9 mm')).toBeInTheDocument();
    expect(screen.getByText('Cuerpo lúteo funcional, 22 mm')).toBeInTheDocument();
    expect(screen.getByText('Sin folículos medidos')).toBeInTheDocument();
    expect(screen.getByText('Sin cuerpo lúteo')).toBeInTheDocument();
    expect(screen.getByText('Tacto previo a servicio')).toBeInTheDocument();
  });

  it('titula el diagnóstico con su resultado y omite datos vacíos', () => {
    const dx: EventoLinea = {
      id: '2',
      tipo: 'DIAGNOSTICO',
      fechaHora: '2026-08-20T10:00:00Z',
      detalle: {
        metodo: 'ECOGRAFIA',
        resultado: 'PRENADA',
        diasGestacion: 44,
        fechaProbableParto: null,
        veterinario: null,
        observaciones: null,
      },
    };
    render(<ol><EventoItem evento={dx} /></ol>);
    expect(screen.getByText('Diagnóstico de preñez: preñada')).toBeInTheDocument();
    expect(screen.getByText('44 días')).toBeInTheDocument();
    expect(screen.queryByText('Revisó')).not.toBeInTheDocument();
    expect(screen.queryByText('Parto probable')).not.toBeInTheDocument();
  });

  it('distingue inseminación artificial de monta natural', () => {
    const base = { id: '3', fechaHora: '2026-07-07T10:00:00Z' } as const;
    const { rerender } = render(
      <ol>
        <EventoItem
          evento={{ ...base, tipo: 'SERVICIO', detalle: { tipo: 'IA', toro: 'Toro A', codigoPajuela: 'PJ-1', inseminador: 'Juan', observaciones: null } }}
        />
      </ol>,
    );
    expect(screen.getByText('Inseminación artificial')).toBeInTheDocument();
    expect(screen.getByText('Inseminador')).toBeInTheDocument();
    rerender(
      <ol>
        <EventoItem
          evento={{ ...base, tipo: 'SERVICIO', detalle: { tipo: 'MONTA', toro: 'Toro B', codigoPajuela: null, inseminador: null, observaciones: null } }}
        />
      </ol>,
    );
    expect(screen.getByText('Monta natural')).toBeInTheDocument();
  });
});
