import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HaciendaProvider } from '../hacienda/HaciendaContext';
import { BuscarPage } from './BuscarPage';

const HACIENDA = { id: '11111111-1111-1111-1111-111111111111', nombre: 'Hacienda Uno', ubicacion: null };
const RESULTADO = {
  id: '22222222-2222-2222-2222-222222222222',
  arete: '0101',
  codigo: 'A-101',
  nombre: 'Margarita',
  estadoReproductivo: 'PRENADA',
  lote: 'Lote 1',
  raza: 'Holstein',
};

function respuesta(cuerpo: unknown) {
  return Promise.resolve(new Response(JSON.stringify(cuerpo), { status: 200 }));
}

function montar() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter>
        <HaciendaProvider>
          <BuscarPage />
        </HaciendaProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BuscarPage', () => {
  const llamadas: string[] = [];

  beforeEach(() => {
    llamadas.length = 0;
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        llamadas.push(url);
        if (url.startsWith('/api/haciendas')) return respuesta([HACIENDA]);
        if (url.startsWith('/api/animales/buscar')) {
          return respuesta(url.includes('q=marg') ? [RESULTADO] : []);
        }
        return respuesta({});
      }),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('busca dentro de la hacienda activa y muestra arete, nombre y estado', async () => {
    const usuario = userEvent.setup();
    montar();
    await usuario.type(await screen.findByRole('searchbox', { name: /arete, código o nombre/i }), 'marg');

    expect(await screen.findByText('Margarita')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Arete 0101' })).toBeInTheDocument();
    expect(screen.getByText('Preñada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /margarita/i })).toHaveAttribute('href', `/animales/${RESULTADO.id}`);
    expect(llamadas.some((u) => u.includes(`haciendaId=${HACIENDA.id}`) && u.includes('q=marg'))).toBe(true);
  });

  it('no consulta al servidor con un solo carácter', async () => {
    const usuario = userEvent.setup();
    montar();
    await usuario.type(await screen.findByRole('searchbox'), 'm');
    expect(await screen.findByText(/al menos 2 caracteres/i)).toBeInTheDocument();
    expect(llamadas.filter((u) => u.startsWith('/api/animales/buscar'))).toHaveLength(0);
  });

  it('ofrece crear el animal cuando no hay coincidencias', async () => {
    const usuario = userEvent.setup();
    montar();
    await usuario.type(await screen.findByRole('searchbox'), '9999');
    const enlace = await screen.findByRole('link', { name: /créalo con el arete 9999/i });
    expect(enlace).toHaveAttribute('href', '/animales/nuevo?arete=9999');
  });
});
