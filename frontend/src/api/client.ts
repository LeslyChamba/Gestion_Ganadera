const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Params = Record<string, string | number | undefined | null>;

interface Opciones {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  params?: Params;
  body?: unknown;
  signal?: AbortSignal;
}

/** Convierte el error de Nest ({ message: string | string[] }) en un texto legible. */
function mensajeDeError(status: number, cuerpo: unknown): string {
  const m = (cuerpo as { message?: unknown } | null)?.message;
  if (typeof m === 'string') return m;
  if (Array.isArray(m)) return 'Algunos datos no son válidos. Revisa el formulario.';
  if (status === 404) return 'No se encontró lo que buscabas.';
  if (status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo en un momento.';
  return 'No se pudo completar la solicitud.';
}

export async function api<T>(path: string, { method = 'GET', params, body, signal }: Opciones = {}): Promise<T> {
  const query = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params ?? {})) {
    if (valor !== undefined && valor !== null && valor !== '') query.set(clave, String(valor));
  }
  const url = `${BASE}${path}${query.size ? `?${query}` : ''}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      method,
      signal,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError(0, 'No hay conexión con el servidor. Revisa tu red e inténtalo de nuevo.');
  }

  if (respuesta.status === 204) return undefined as T;
  const cuerpo: unknown = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new ApiError(respuesta.status, mensajeDeError(respuesta.status, cuerpo));
  return cuerpo as T;
}
