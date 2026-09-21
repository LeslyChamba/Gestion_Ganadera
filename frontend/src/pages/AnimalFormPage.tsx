import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import {
  useActualizarAnimal,
  useCrearAnimal,
  useDarDeBaja,
  useFicha,
  useLotes,
  useRazas,
} from '../api/hooks';
import type { AnimalPayload } from '../api/tipos';
import { Aviso } from '../components/Aviso';
import { Volver } from '../components/Volver';
import { useHacienda } from '../hacienda/HaciendaContext';
import { hoyISO } from '../lib/formato';

const esquema = z.object({
  arete: z.string().trim().min(1, 'Escribe el número de arete').max(30, 'El arete admite hasta 30 caracteres'),
  codigo: z.string().trim().max(30, 'El código admite hasta 30 caracteres'),
  nombre: z.string().trim().max(80, 'El nombre admite hasta 80 caracteres'),
  fechaNacimiento: z.string().refine((v) => v === '' || v <= hoyISO(), 'La fecha de nacimiento no puede ser futura'),
  razaId: z.string(),
  loteId: z.string(),
  observaciones: z.string().trim().max(1000, 'Las observaciones admiten hasta 1000 caracteres'),
});
type Valores = z.infer<typeof esquema>;

const VACIOS: Valores = {
  arete: '',
  codigo: '',
  nombre: '',
  fechaNacimiento: '',
  razaId: '',
  loteId: '',
  observaciones: '',
};

function Campo({
  id,
  etiqueta,
  error,
  ayuda,
  children,
}: {
  id: string;
  etiqueta: string;
  error?: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="campo" data-invalido={error ? 'true' : undefined}>
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {ayuda && !error && <p className="campo-ayuda">{ayuda}</p>}
      {error && (
        <p className="campo-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export function AnimalFormPage({ modo }: { modo: 'crear' | 'editar' }) {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const { hacienda: activa } = useHacienda();
  const dialogo = useRef<HTMLDialogElement>(null);

  const ficha = useFicha(modo === 'editar' ? id : undefined);
  const haciendaId = modo === 'editar' ? ficha.data?.hacienda.id : activa?.id;

  const razas = useRazas();
  const lotes = useLotes(haciendaId);
  const crear = useCrearAnimal();
  const actualizar = useActualizarAnimal(id);
  const baja = useDarDeBaja(id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<Valores>({ resolver: zodResolver(esquema), defaultValues: VACIOS });

  // Alta: el arete puede llegar desde el buscador ("créalo con el arete 0123").
  useEffect(() => {
    if (modo === 'crear') reset({ ...VACIOS, arete: params.get('arete') ?? '' });
  }, [modo, params, reset]);

  // Edición: se rellena con los datos actuales.
  useEffect(() => {
    const f = ficha.data;
    if (modo !== 'editar' || !f) return;
    reset({
      arete: f.arete,
      codigo: f.codigo ?? '',
      nombre: f.nombre ?? '',
      fechaNacimiento: f.fechaNacimiento ?? '',
      razaId: f.raza?.id ?? '',
      loteId: f.lote?.id ?? '',
      observaciones: f.observaciones ?? '',
    });
  }, [modo, ficha.data, reset]);

  const mutacion = modo === 'crear' ? crear : actualizar;

  const alGuardar = handleSubmit((v) => {
    // En edición, un campo vacío se envía como null para poder borrar el dato.
    const vacio = modo === 'editar' ? null : undefined;
    const o = (s: string) => (s === '' ? vacio : s);
    const datos: AnimalPayload = {
      arete: v.arete,
      codigo: o(v.codigo),
      nombre: o(v.nombre),
      razaId: o(v.razaId),
      loteId: o(v.loteId),
      fechaNacimiento: o(v.fechaNacimiento),
      observaciones: o(v.observaciones),
      ...(modo === 'crear' ? { haciendaId } : {}),
    };
    mutacion.mutate(datos, { onSuccess: (f) => navegar(`/animales/${f.id}`, { replace: true }) });
  });

  // --- Estados previos al formulario
  if (modo === 'editar' && ficha.isPending) return <p className="cargando">Cargando ficha…</p>;
  if (modo === 'editar' && ficha.isError) {
    return (
      <>
        <Volver etiqueta="Volver" />
        <Aviso titulo="No se pudo cargar la ficha">{ficha.error.message}</Aviso>
      </>
    );
  }
  if (modo === 'crear' && !activa) {
    return (
      <>
        <Volver />
        <Aviso tipo="info" titulo="Primero elige una hacienda">
          El animal se registra dentro de una hacienda. Elígela arriba o desde el <Link to="/">buscador</Link>.
        </Aviso>
      </>
    );
  }

  const quien = ficha.data?.nombre ? `a ${ficha.data.nombre}` : `el arete ${ficha.data?.arete ?? ''}`;

  return (
    <section>
      <Volver etiqueta="Volver" />
      <h1>{modo === 'crear' ? 'Nuevo animal' : 'Editar ficha'}</h1>
      {modo === 'crear' && activa && <p className="ayuda">Se registrará en {activa.nombre}.</p>}

      <form onSubmit={alGuardar} noValidate className="formulario">
        {mutacion.isError && <Aviso titulo="No se pudo guardar">{mutacion.error.message}</Aviso>}

        <Campo id="arete" etiqueta="Número de arete" error={errors.arete?.message}>
          <input
            id="arete"
            inputMode="text"
            autoComplete="off"
            autoFocus={modo === 'crear' && !params.get('arete')}
            aria-invalid={!!errors.arete}
            aria-describedby={errors.arete ? 'arete-error' : undefined}
            {...register('arete')}
          />
        </Campo>

        <div className="fila-campos">
          <Campo id="codigo" etiqueta="Código (opcional)" error={errors.codigo?.message}>
            <input id="codigo" autoComplete="off" {...register('codigo')} />
          </Campo>
          <Campo id="nombre" etiqueta="Nombre (opcional)" error={errors.nombre?.message}>
            <input id="nombre" autoComplete="off" {...register('nombre')} />
          </Campo>
        </div>

        <Campo id="fechaNacimiento" etiqueta="Fecha de nacimiento (opcional)" error={errors.fechaNacimiento?.message}>
          <input id="fechaNacimiento" type="date" max={hoyISO()} {...register('fechaNacimiento')} />
        </Campo>

        <div className="fila-campos">
          <Campo id="razaId" etiqueta="Raza">
            <select id="razaId" {...register('razaId')}>
              <option value="">Sin especificar</option>
              {razas.data?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <Campo id="loteId" etiqueta="Lote">
            <select id="loteId" {...register('loteId')}>
              <option value="">Sin lote</option>
              {lotes.data?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <Campo id="observaciones" etiqueta="Observaciones (opcional)" error={errors.observaciones?.message}>
          <textarea id="observaciones" rows={3} {...register('observaciones')} />
        </Campo>

        <div className="acciones">
          <button type="submit" className="boton" disabled={mutacion.isPending || (modo === 'editar' && !isDirty)}>
            {mutacion.isPending ? 'Guardando…' : modo === 'crear' ? 'Crear animal' : 'Guardar cambios'}
          </button>
          <button type="button" className="boton boton-secundario" onClick={() => navegar(-1)}>
            Cancelar
          </button>
        </div>
      </form>

      {modo === 'editar' && ficha.data?.activo && (
        <div className="zona-baja">
          <h2>Dar de baja</h2>
          <p>El animal deja de aparecer en el buscador. Su historial reproductivo se conserva.</p>
          <button type="button" className="boton boton-peligro" onClick={() => dialogo.current?.showModal()}>
            <Trash2 size={18} aria-hidden="true" />
            Dar de baja
          </button>
        </div>
      )}

      <dialog ref={dialogo} className="dialogo" aria-labelledby="titulo-baja">
        <h2 id="titulo-baja">¿Dar de baja {quien}?</h2>
        <p>Dejará de aparecer en el buscador. Su historial reproductivo se conserva.</p>
        {baja.isError && <Aviso titulo="No se pudo dar de baja">{baja.error.message}</Aviso>}
        <div className="acciones">
          <button
            type="button"
            className="boton boton-peligro"
            disabled={baja.isPending}
            onClick={() => baja.mutate(undefined, { onSuccess: () => navegar('/', { replace: true }) })}
          >
            {baja.isPending ? 'Dando de baja…' : 'Dar de baja'}
          </button>
          <button type="button" className="boton boton-secundario" onClick={() => dialogo.current?.close()}>
            Cancelar
          </button>
        </div>
      </dialog>
    </section>
  );
}
