import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useHaciendas } from '../api/hooks';
import type { Hacienda } from '../api/tipos';

const CLAVE = 'hacienda-activa';

interface Valor {
  haciendas: Hacienda[];
  hacienda: Hacienda | null;
  cargando: boolean;
  error: Error | null;
  elegir: (id: string) => void;
}

const Contexto = createContext<Valor | null>(null);

function leer(): string | null {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

/** Guarda la hacienda en uso: todo el sistema (buscador, altas) trabaja dentro de una hacienda. */
export function HaciendaProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, error } = useHaciendas();
  const [id, setId] = useState<string | null>(leer);
  const haciendas = useMemo(() => data ?? [], [data]);

  // Si solo hay una hacienda, se elige sola. Si la guardada ya no existe, se descarta.
  useEffect(() => {
    if (!data) return;
    if (id && data.some((h) => h.id === id)) return;
    setId(data.length === 1 ? data[0].id : null);
  }, [data, id]);

  const elegir = useCallback((nuevo: string) => {
    setId(nuevo);
    try {
      localStorage.setItem(CLAVE, nuevo);
    } catch {
      /* sin almacenamiento: solo se pierde la preferencia */
    }
  }, []);

  const valor = useMemo<Valor>(
    () => ({
      haciendas,
      hacienda: haciendas.find((h) => h.id === id) ?? null,
      cargando: isLoading,
      error: error as Error | null,
      elegir,
    }),
    [haciendas, id, isLoading, error, elegir],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useHacienda(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error('useHacienda debe usarse dentro de <HaciendaProvider>');
  return v;
}
