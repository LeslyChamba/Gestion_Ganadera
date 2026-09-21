import { useEffect, useRef, useState } from 'react';

export function useDebounce<T>(valor: T, ms = 200): T {
  const [debounced, setDebounced] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return debounced;
}

/** Llama a `alVer` cuando el elemento devuelto entra en pantalla (scroll infinito). */
export function useAlEntrarEnPantalla<T extends Element>(alVer: () => void, activo: boolean) {
  const ref = useRef<T | null>(null);
  const callback = useRef(alVer);
  callback.current = alVer;

  useEffect(() => {
    const el = ref.current;
    if (!activo || !el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) callback.current();
      },
      { rootMargin: '300px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [activo]);

  return ref;
}
