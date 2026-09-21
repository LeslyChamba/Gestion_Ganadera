-- =====================================================================
--  Sistema de historial ginecológico y reproductivo bovino
--  PostgreSQL 13+  (probado en 16)
--
--  Uso:
--    createdb reproductivo
--    psql -d reproductivo -f database/schema.sql
--    psql -d reproductivo -f database/seed.sql      -- datos de ejemplo (opcional)
--
--  Convenciones:
--    * Claves primarias UUID (gen_random_uuid): permiten crear registros
--      sin conexión en el celular y sincronizarlos después sin choques.
--    * Todos los eventos usan `fecha_hora timestamptz`.
--    * El estado reproductivo actual vive en animales.estado_reproductivo y
--      lo actualiza el backend al registrar cada evento (Módulo 2).
-- =====================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- búsqueda parcial / tolerante a errores de escritura
CREATE EXTENSION IF NOT EXISTS unaccent;  -- "nina" encuentra "Niña", "pena" encuentra "Peña"

-- unaccent() es STABLE; este envoltorio IMMUTABLE permite usarlo en una columna generada e indexarla.
CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

-- ---------------------------------------------------------------------
--  Tipos enumerados
-- ---------------------------------------------------------------------
CREATE TYPE rol_persona          AS ENUM ('VETERINARIO', 'INSEMINADOR', 'OPERARIO');
CREATE TYPE rol_usuario          AS ENUM ('ADMIN', 'VETERINARIO', 'INSEMINADOR');
CREATE TYPE estado_reproductivo  AS ENUM ('SIN_DATOS', 'VACIA', 'EN_CELO', 'SERVIDA', 'PRENADA', 'POSPARTO');
CREATE TYPE lado_ovario          AS ENUM ('IZQUIERDO', 'DERECHO');
CREATE TYPE estado_cl            AS ENUM ('EN_FORMACION', 'FUNCIONAL', 'REGRESION');
CREATE TYPE tipo_servicio        AS ENUM ('IA', 'MONTA');
CREATE TYPE origen_toro          AS ENUM ('MONTA', 'PAJUELA');
CREATE TYPE metodo_diagnostico   AS ENUM ('PALPACION', 'ECOGRAFIA');
CREATE TYPE resultado_diagnostico AS ENUM ('PRENADA', 'VACIA', 'DUDOSA');
CREATE TYPE tipo_tratamiento     AS ENUM ('HORMONAL', 'MEDICO');

-- ---------------------------------------------------------------------
--  Función genérica para updated_at
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
--  CATÁLOGOS Y PERSONAL
-- =====================================================================
CREATE TABLE haciendas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL UNIQUE,
  ubicacion   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE lotes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hacienda_id  uuid NOT NULL REFERENCES haciendas(id) ON DELETE CASCADE,
  nombre       text NOT NULL,
  UNIQUE (hacienda_id, nombre),
  UNIQUE (id, hacienda_id)          -- necesario para la FK compuesta de animales
);

CREATE TABLE razas (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre  text NOT NULL UNIQUE
);

CREATE TABLE personas (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre  text NOT NULL,
  rol     rol_persona NOT NULL,
  activo  boolean NOT NULL DEFAULT true
);

CREATE TABLE usuarios (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id     uuid REFERENCES personas(id) ON DELETE SET NULL,
  email          text NOT NULL UNIQUE,
  password_hash  text NOT NULL,
  rol            rol_usuario NOT NULL,
  activo         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE toros (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre    text NOT NULL,
  codigo    text UNIQUE,
  raza_id   uuid REFERENCES razas(id),
  origen    origen_toro NOT NULL DEFAULT 'PAJUELA'
);

-- =====================================================================
--  MÓDULO 1 — Animales (ficha técnica y buscador)
-- =====================================================================
CREATE TABLE animales (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hacienda_id               uuid NOT NULL REFERENCES haciendas(id),
  lote_id                   uuid,
  raza_id                   uuid REFERENCES razas(id),
  arete                     text NOT NULL,
  codigo                    text,
  nombre                    text,
  fecha_nacimiento          date CHECK (fecha_nacimiento <= CURRENT_DATE),
  madre_id                  uuid REFERENCES animales(id) ON DELETE SET NULL,
  estado_reproductivo       estado_reproductivo NOT NULL DEFAULT 'SIN_DATOS',
  estado_actualizado_at     timestamptz NOT NULL DEFAULT now(),
  activo                    boolean NOT NULL DEFAULT true,   -- baja lógica
  observaciones             text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),

  -- Texto normalizado (minúsculas, sin tildes) con arete + código + nombre.
  -- Una sola columna = un solo índice: el buscador no depende de combinar índices con OR.
  busqueda                  text GENERATED ALWAYS AS (
                              f_unaccent(lower(arete || ' ' || coalesce(codigo, '') || ' ' || coalesce(nombre, '')))
                            ) STORED,

  UNIQUE (hacienda_id, arete),
  UNIQUE (hacienda_id, codigo),
  -- Garantiza que el lote pertenezca a la misma hacienda del animal
  FOREIGN KEY (lote_id, hacienda_id) REFERENCES lotes (id, hacienda_id)
);

CREATE TRIGGER trg_animales_updated_at
  BEFORE UPDATE ON animales
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Buscador: coincidencia parcial (LIKE '%x%') y tolerante a errores (<%), ambas sobre el mismo índice
CREATE INDEX idx_animales_busqueda_trgm ON animales USING gin (busqueda gin_trgm_ops);
CREATE INDEX idx_animales_hacienda     ON animales (hacienda_id) WHERE activo;
CREATE INDEX idx_animales_lote         ON animales (lote_id)     WHERE activo;

-- =====================================================================
--  MÓDULO 2 — Historial ginecológico y reproductivo
-- =====================================================================

-- Chequeos / tactos (cabecera)
CREATE TABLE chequeos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id       uuid NOT NULL REFERENCES animales(id) ON DELETE CASCADE,
  fecha_hora      timestamptz NOT NULL DEFAULT now(),
  veterinario_id  uuid REFERENCES personas(id),
  observaciones   text,
  created_by      uuid REFERENCES usuarios(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chequeos_animal_fecha ON chequeos (animal_id, fecha_hora DESC);

-- Hallazgos por ovario (una fila por lado dentro de cada chequeo)
CREATE TABLE hallazgos_ovario (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chequeo_id       uuid NOT NULL REFERENCES chequeos(id) ON DELETE CASCADE,
  lado             lado_ovario NOT NULL,
  foliculos_mm     numeric(4,1)[] NOT NULL DEFAULT '{}',   -- diámetro de cada folículo medido
  cl_presente      boolean NOT NULL DEFAULT false,
  cl_estado        estado_cl,
  cl_diametro_mm   numeric(4,1) CHECK (cl_diametro_mm > 0),
  observaciones    text,
  UNIQUE (chequeo_id, lado),
  CHECK (cl_presente OR (cl_estado IS NULL AND cl_diametro_mm IS NULL))
);

-- Celos
CREATE TABLE celos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id     uuid NOT NULL REFERENCES animales(id) ON DELETE CASCADE,
  fecha_hora    timestamptz NOT NULL DEFAULT now(),
  detectado_por uuid REFERENCES personas(id),
  observaciones text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_celos_animal_fecha ON celos (animal_id, fecha_hora DESC);

-- Servicios: inseminación artificial o monta natural
CREATE TABLE servicios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id       uuid NOT NULL REFERENCES animales(id) ON DELETE CASCADE,
  tipo            tipo_servicio NOT NULL,
  fecha_hora      timestamptz NOT NULL DEFAULT now(),
  toro_id         uuid REFERENCES toros(id),
  codigo_pajuela  text,
  inseminador_id  uuid REFERENCES personas(id),
  celo_id         uuid REFERENCES celos(id) ON DELETE SET NULL,
  observaciones   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  -- Siempre debe identificarse el toro o la pajuela
  CHECK (toro_id IS NOT NULL OR codigo_pajuela IS NOT NULL),
  -- En IA es obligatorio el inseminador responsable
  CHECK (tipo <> 'IA' OR inseminador_id IS NOT NULL)
);
CREATE INDEX idx_servicios_animal_fecha ON servicios (animal_id, fecha_hora DESC);
CREATE INDEX idx_servicios_celo         ON servicios (celo_id);

-- Diagnóstico de preñez (siempre ligado a un servicio)
CREATE TABLE diagnosticos_prenez (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id              uuid NOT NULL REFERENCES animales(id) ON DELETE CASCADE,
  servicio_id            uuid NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
  fecha_hora             timestamptz NOT NULL DEFAULT now(),
  metodo                 metodo_diagnostico NOT NULL,
  resultado              resultado_diagnostico NOT NULL,
  dias_gestacion         integer CHECK (dias_gestacion BETWEEN 0 AND 320),
  fecha_probable_parto   date,
  veterinario_id         uuid REFERENCES personas(id),
  observaciones          text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  -- Fecha probable de parto solo tiene sentido si resultó preñada
  CHECK (resultado = 'PRENADA' OR fecha_probable_parto IS NULL)
);
CREATE INDEX idx_diagnosticos_animal_fecha ON diagnosticos_prenez (animal_id, fecha_hora DESC);
CREATE INDEX idx_diagnosticos_servicio     ON diagnosticos_prenez (servicio_id);

-- =====================================================================
--  MÓDULO 3 — Protocolos y tratamientos
-- =====================================================================
CREATE TABLE protocolos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       text NOT NULL UNIQUE,
  descripcion  text,
  pasos        jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{"dia":0,"accion":"..."}, ...]
  activo       boolean NOT NULL DEFAULT true
);

CREATE TABLE tratamientos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id       uuid NOT NULL REFERENCES animales(id) ON DELETE CASCADE,
  tipo            tipo_tratamiento NOT NULL,
  protocolo_id    uuid REFERENCES protocolos(id),
  producto        text NOT NULL,
  dosis           text,
  via             text,
  fecha_hora      timestamptz NOT NULL DEFAULT now(),
  responsable_id  uuid REFERENCES personas(id),
  observaciones   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tratamientos_animal_fecha ON tratamientos (animal_id, fecha_hora DESC);

-- =====================================================================
--  LÍNEA DE TIEMPO — vista unificada (más reciente primero al consultar)
--    SELECT tipo, fecha_hora, ref_id, detalle FROM v_linea_tiempo
--     WHERE animal_id = $1 ORDER BY fecha_hora DESC LIMIT 20;
--  `detalle` es un jsonb con los datos ya resueltos (nombres de toro, personal,
--  hallazgos de cada ovario...) para que el frontend no tenga que hacer más consultas.
-- =====================================================================
CREATE VIEW v_linea_tiempo AS
  SELECT c.animal_id,
         'CHEQUEO'::text AS tipo,
         c.fecha_hora,
         c.id            AS ref_id,
         jsonb_build_object(
           'observaciones', c.observaciones,
           'veterinario',   p.nombre,
           'ovarios', COALESCE((
             SELECT jsonb_agg(jsonb_build_object(
                      'lado',          h.lado,
                      'foliculosMm',   h.foliculos_mm,
                      'clPresente',    h.cl_presente,
                      'clEstado',      h.cl_estado,
                      'clDiametroMm',  h.cl_diametro_mm,
                      'observaciones', h.observaciones) ORDER BY h.lado)
               FROM hallazgos_ovario h WHERE h.chequeo_id = c.id), '[]'::jsonb)
         ) AS detalle
    FROM chequeos c
    LEFT JOIN personas p ON p.id = c.veterinario_id
  UNION ALL
  SELECT ce.animal_id, 'CELO', ce.fecha_hora, ce.id,
         jsonb_build_object('observaciones', ce.observaciones,
                            'detectadoPor',  p.nombre)
    FROM celos ce
    LEFT JOIN personas p ON p.id = ce.detectado_por
  UNION ALL
  SELECT s.animal_id, 'SERVICIO', s.fecha_hora, s.id,
         jsonb_build_object('tipo',          s.tipo,
                            'toro',          t.nombre,
                            'codigoPajuela', s.codigo_pajuela,
                            'inseminador',   p.nombre,
                            'observaciones', s.observaciones)
    FROM servicios s
    LEFT JOIN toros t    ON t.id = s.toro_id
    LEFT JOIN personas p ON p.id = s.inseminador_id
  UNION ALL
  SELECT d.animal_id, 'DIAGNOSTICO', d.fecha_hora, d.id,
         jsonb_build_object('metodo',             d.metodo,
                            'resultado',          d.resultado,
                            'diasGestacion',      d.dias_gestacion,
                            'fechaProbableParto', d.fecha_probable_parto,
                            'veterinario',        p.nombre,
                            'observaciones',      d.observaciones)
    FROM diagnosticos_prenez d
    LEFT JOIN personas p ON p.id = d.veterinario_id
  UNION ALL
  SELECT tr.animal_id, 'TRATAMIENTO', tr.fecha_hora, tr.id,
         jsonb_build_object('tipo',          tr.tipo,
                            'producto',      tr.producto,
                            'dosis',         tr.dosis,
                            'via',           tr.via,
                            'protocolo',     pr.nombre,
                            'responsable',   p.nombre,
                            'observaciones', tr.observaciones)
    FROM tratamientos tr
    LEFT JOIN protocolos pr ON pr.id = tr.protocolo_id
    LEFT JOIN personas p    ON p.id  = tr.responsable_id;

-- =====================================================================
--  AUDITORÍA
-- =====================================================================
CREATE TABLE auditoria (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id  uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  entidad     text NOT NULL,
  entidad_id  uuid NOT NULL,
  accion      text NOT NULL CHECK (accion IN ('CREAR', 'ACTUALIZAR', 'ELIMINAR')),
  cambios     jsonb,
  fecha_hora  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_auditoria_entidad ON auditoria (entidad, entidad_id, fecha_hora DESC);

COMMIT;
