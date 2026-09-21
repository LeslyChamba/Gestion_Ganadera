import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  AnimalPayload,
  Ficha,
  Hacienda,
  Lote,
  PaginaLinea,
  Raza,
  ResultadoBusqueda,
  TipoEvento,
} from './tipos';

const CINCO_MIN = 5 * 60_000;

export const useHaciendas = () =>
  useQuery({ queryKey: ['haciendas'], queryFn: () => api<Hacienda[]>('/haciendas'), staleTime: CINCO_MIN });

export const useLotes = (haciendaId?: string) =>
  useQuery({
    queryKey: ['lotes', haciendaId],
    queryFn: () => api<Lote[]>(`/haciendas/${haciendaId}/lotes`),
    enabled: !!haciendaId,
    staleTime: CINCO_MIN,
  });

export const useRazas = () =>
  useQuery({ queryKey: ['razas'], queryFn: () => api<Raza[]>('/razas'), staleTime: CINCO_MIN });

export const MIN_CARACTERES_BUSQUEDA = 2;

export function useBuscar(texto: string, haciendaId?: string) {
  const q = texto.trim();
  return useQuery({
    queryKey: ['buscar', haciendaId, q],
    queryFn: ({ signal }) => api<ResultadoBusqueda[]>('/animales/buscar', { params: { q, haciendaId }, signal }),
    enabled: !!haciendaId && q.length >= MIN_CARACTERES_BUSQUEDA,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export const useFicha = (id?: string) =>
  useQuery({
    queryKey: ['ficha', id],
    queryFn: ({ signal }) => api<Ficha>(`/animales/${id}`, { signal }),
    enabled: !!id,
  });

/** Historial paginado por cursor: del evento más reciente al más antiguo. */
export function useLineaTiempo(animalId: string | undefined, tipos: TipoEvento[]) {
  const filtro = [...tipos].sort().join(',');
  return useInfiniteQuery({
    queryKey: ['linea', animalId, filtro],
    queryFn: ({ pageParam, signal }) =>
      api<PaginaLinea>(`/animales/${animalId}/linea-tiempo`, {
        params: { cursor: pageParam, tipos: filtro || undefined, limit: 20 },
        signal,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (ultima) => ultima.nextCursor ?? undefined,
    enabled: !!animalId,
  });
}

export function useCrearAnimal() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (datos: AnimalPayload) => api<Ficha>('/animales', { method: 'POST', body: datos }),
    onSuccess: (ficha) => {
      cliente.setQueryData(['ficha', ficha.id], ficha);
      void cliente.invalidateQueries({ queryKey: ['buscar'] });
    },
  });
}

export function useActualizarAnimal(id: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (datos: AnimalPayload) => api<Ficha>(`/animales/${id}`, { method: 'PATCH', body: datos }),
    onSuccess: (ficha) => {
      cliente.setQueryData(['ficha', id], ficha);
      void cliente.invalidateQueries({ queryKey: ['buscar'] });
    },
  });
}

export function useDarDeBaja(id: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>(`/animales/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      cliente.removeQueries({ queryKey: ['ficha', id] });
      void cliente.invalidateQueries({ queryKey: ['buscar'] });
    },
  });
}
