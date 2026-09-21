-- Migración 001: la vista v_linea_tiempo pasa de `resumen` (texto) a `detalle` (jsonb).
-- Solo hace falta si ya habías ejecutado la versión anterior de schema.sql.
--   psql -d reproductivo -f database/migraciones/001_linea_tiempo_detalle.sql

BEGIN;
DROP VIEW IF EXISTS v_linea_tiempo;

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

COMMIT;
