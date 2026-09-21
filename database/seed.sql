-- Datos de EJEMPLO para probar el buscador, la ficha y la línea de tiempo.
-- No usar en producción. Ajusta protocolos y dosis con el criterio del veterinario.

BEGIN;

INSERT INTO haciendas (nombre, ubicacion) VALUES ('Hacienda de ejemplo', 'Riobamba');

INSERT INTO lotes (hacienda_id, nombre)
  SELECT id, l FROM haciendas, unnest(ARRAY['Lote 1 - Producción', 'Lote 2 - Vaconas', 'Lote 3 - Secas']) AS l;

INSERT INTO razas (nombre) VALUES ('Holstein'), ('Jersey'), ('Brown Swiss'), ('Criolla'), ('Mestiza');

INSERT INTO personas (nombre, rol) VALUES
  ('Dra. Ejemplo Veterinaria', 'VETERINARIO'),
  ('Juan Inseminador',         'INSEMINADOR');

INSERT INTO toros (nombre, codigo, raza_id, origen)
  SELECT 'Toro Ejemplo A', 'T-001', r.id, 'PAJUELA' FROM razas r WHERE r.nombre = 'Holstein';

INSERT INTO protocolos (nombre, descripcion, pasos) VALUES
  ('Ovsynch (ejemplo)', 'Protocolo de sincronización de ovulación de ejemplo; validar con el veterinario.',
   '[{"dia":0,"accion":"GnRH"},{"dia":7,"accion":"PGF2α"},{"dia":9,"accion":"GnRH"},{"dia":10,"accion":"IATF"}]');

-- Animales
INSERT INTO animales (hacienda_id, lote_id, raza_id, arete, codigo, nombre, fecha_nacimiento)
SELECT h.id, l.id, r.id, v.arete, v.codigo, v.nombre, v.nac::date
  FROM (VALUES
    ('0101', 'A-101', 'Margarita', 'Lote 1 - Producción', 'Holstein',    '2020-03-15'),
    ('0102', 'A-102', 'Luna',      'Lote 1 - Producción', 'Holstein',    '2019-11-02'),
    ('0103', 'A-103', 'Canela',    'Lote 1 - Producción', 'Jersey',      '2021-06-20'),
    ('0204', 'B-204', 'Estrella',  'Lote 2 - Vaconas',    'Mestiza',     '2024-01-10'),
    ('0205', 'B-205', 'Paloma',    'Lote 2 - Vaconas',    'Criolla',     '2024-04-25'),
    ('0306', 'C-306', 'Morena',    'Lote 3 - Secas',      'Brown Swiss', '2018-08-05')
  ) AS v(arete, codigo, nombre, lote, raza, nac)
  JOIN haciendas h ON h.nombre = 'Hacienda de ejemplo'
  JOIN lotes l ON l.hacienda_id = h.id AND l.nombre = v.lote
  JOIN razas r ON r.nombre = v.raza;

-- Historial de ejemplo para "Margarita": celo -> IA -> diagnóstico positivo -> chequeo -> tratamiento
WITH a AS (SELECT id FROM animales WHERE arete = '0101'),
     vet AS (SELECT id FROM personas WHERE rol = 'VETERINARIO' LIMIT 1),
     ins AS (SELECT id FROM personas WHERE rol = 'INSEMINADOR' LIMIT 1),
     toro AS (SELECT id FROM toros LIMIT 1),
     celo AS (
       INSERT INTO celos (animal_id, fecha_hora, detectado_por, observaciones)
       SELECT a.id, now() - interval '75 days', ins.id, 'Monta a otras vacas, moco cristalino' FROM a, ins
       RETURNING id, animal_id),
     serv AS (
       INSERT INTO servicios (animal_id, tipo, fecha_hora, toro_id, codigo_pajuela, inseminador_id, celo_id)
       SELECT celo.animal_id, 'IA', now() - interval '74 days', toro.id, 'PJ-2024-118', ins.id, celo.id
         FROM celo, toro, ins
       RETURNING id, animal_id),
     ch AS (
       INSERT INTO chequeos (animal_id, fecha_hora, veterinario_id, observaciones)
       SELECT a.id, now() - interval '90 days', vet.id, 'Tacto previo a servicio' FROM a, vet
       RETURNING id),
     ho AS (
       INSERT INTO hallazgos_ovario (chequeo_id, lado, foliculos_mm, cl_presente, cl_estado, cl_diametro_mm)
       SELECT ch.id, 'IZQUIERDO'::lado_ovario, '{12.5, 9.0}'::numeric[], true,  'FUNCIONAL'::estado_cl, 22.0 FROM ch
       UNION ALL
       SELECT ch.id, 'DERECHO'::lado_ovario,   '{}'::numeric[],          false, NULL::estado_cl,        NULL::numeric FROM ch
       RETURNING id),
     dx AS (
       INSERT INTO diagnosticos_prenez (animal_id, servicio_id, fecha_hora, metodo, resultado, dias_gestacion, fecha_probable_parto, veterinario_id)
       SELECT serv.animal_id, serv.id, now() - interval '30 days', 'ECOGRAFIA', 'PRENADA', 44,
              (current_date + 240), vet.id
         FROM serv, vet
       RETURNING id)
INSERT INTO tratamientos (animal_id, tipo, producto, dosis, via, fecha_hora, responsable_id, observaciones)
SELECT a.id, 'MEDICO', 'Vitamina ADE (ejemplo)', '10 ml', 'IM', now() - interval '10 days', vet.id, 'Aplicación de ejemplo'
  FROM a, vet;

UPDATE animales SET estado_reproductivo = 'PRENADA', estado_actualizado_at = now() WHERE arete = '0101';
UPDATE animales SET estado_reproductivo = 'VACIA',   estado_actualizado_at = now() WHERE arete IN ('0102', '0306');

COMMIT;
