# Sistema de historial ginecológico y reproductivo bovino

Base de datos completa (Módulos 1, 2 y 3), backend NestJS y frontend React.

Ya funciona de punta a punta: **buscador, ficha del animal (alta, edición y baja) y línea de tiempo**.
Los formularios para registrar chequeos, celos, servicios, diagnósticos y tratamientos (Módulos 2 y 3)
se construyen junto con sus endpoints; hoy esos eventos se leen en la línea de tiempo.

```
database/
  schema.sql        Esquema completo: animales, chequeos, hallazgos por ovario, celos,
                    servicios (IA/monta), diagnósticos, protocolos, tratamientos,
                    vista v_linea_tiempo y auditoría
  seed.sql          Datos de ejemplo (opcional)
  migraciones/      Cambios para quien ya creó la base con una versión anterior
backend/            API NestJS + TypeORM
frontend/           React + Vite + TypeScript
```

## Puesta en marcha

Requisitos: Node 20+ y PostgreSQL 13+ (probado con Node 22 y PostgreSQL 16).

```bash
# 1. Base de datos
createdb reproductivo
psql -d reproductivo -f database/schema.sql
psql -d reproductivo -f database/seed.sql        # opcional: datos de ejemplo

# 2. Backend
cd backend
cp .env.example .env                              # ajusta usuario/clave de PostgreSQL
npm install
npm run start:dev                                 # http://localhost:3000/api

# 3. Frontend (otra terminal)
cd frontend
npm install
npm run dev                                       # http://localhost:5173
```

En desarrollo, Vite redirige `/api` al backend (puerto 3000), así que no hay que configurar CORS.
Para otro servidor: `VITE_PROXY_TARGET` (desarrollo) o `VITE_API_URL` (compilación), ver `frontend/.env.example`.

Si ya habías creado la base con la versión anterior del esquema, aplica
`database/migraciones/001_linea_tiempo_detalle.sql` (la vista de la línea de tiempo cambió).

`schema.sql` crea las extensiones `pg_trgm` y `unaccent`. Ambas son "trusted": las puede crear
el dueño de la base de datos, no hace falta ser superusuario (PostgreSQL 13+).

## Endpoints del Módulo 1

Prefijo `/api`. Los nombres van en camelCase.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/haciendas` | Lista de haciendas |
| GET | `/haciendas/:id/lotes` | Lotes de una hacienda |
| GET | `/razas` | Catálogo de razas |
| GET | `/animales/buscar?q=&haciendaId=&limit=` | Buscador por arete, código o nombre (mín. 2 caracteres) |
| GET | `/animales?haciendaId=&loteId=&page=&pageSize=` | Listado paginado |
| GET | `/animales/:id` | Ficha: datos básicos, edad, estado y resumen reproductivo |
| POST | `/animales` | Crear animal |
| PATCH | `/animales/:id` | Editar (la hacienda no se puede cambiar) |
| DELETE | `/animales/:id` | Baja lógica (204); el historial se conserva |
| GET | `/animales/:id/linea-tiempo?tipos=&cursor=&limit=` | Historial del animal, del más reciente al más antiguo, paginado por cursor. `tipos` admite `CHEQUEO,CELO,SERVICIO,DIAGNOSTICO,TRATAMIENTO` |

Ejemplo:

```bash
curl "http://localhost:3000/api/animales/buscar?q=marg&haciendaId=<ID_HACIENDA>"
```

## Frontend

Pensado para usarse de pie, con una mano y a pleno sol: letra de 17 px, controles de 44 px o más,
contraste alto. Cada vaca se identifica con su arete dibujado como placa amarilla.

| Pantalla | Ruta | Qué hace |
|---|---|---|
| Buscar | `/` | Buscador con resultados mientras escribes; Enter abre el primer resultado; `/` enfoca el campo. La búsqueda queda en la URL |
| Ficha | `/animales/:id` | Arete, estado reproductivo, datos básicos, situación (último chequeo, celo, servicio, diagnóstico y parto probable) e historial |
| Alta y edición | `/animales/nuevo`, `/animales/:id/editar` | Formulario con validación; desde el buscador se puede crear un animal con el arete ya escrito. Incluye "Dar de baja" |

- **Línea de tiempo:** más reciente primero, agrupada por mes, con filtros por tipo y carga de páginas al llegar al final.
  Los chequeos muestran folículos y cuerpo lúteo de cada ovario sin tener que abrir nada.
- **Hacienda activa:** se elige en la cabecera y se recuerda en el navegador. Si solo hay una, se elige sola.
- **Estados:** siempre con color, ícono y texto (no dependen solo del color).

Pruebas: `npm test` dentro de `frontend/` (formato de fechas y medidas, tarjetas de la línea de tiempo y buscador).

## Cómo funciona el buscador

- La columna generada `animales.busqueda` guarda `arete + código + nombre` en minúsculas y sin tildes,
  con **un solo índice GIN trigram**. "nina" encuentra "Niña".
- Fase 1: coincidencia parcial (`LIKE '%texto%'`). Orden: arete/código exacto, luego los que empiezan con
  el texto, luego el resto.
- Fase 2 (solo si faltan resultados y la búsqueda tiene letras): tolerancia a errores de escritura
  ("margarta" encuentra "Margarita"). No se aplica a búsquedas numéricas para no mezclar aretes distintos.

## Reglas que ya están en la base de datos

- Arete y código únicos **por hacienda** (pueden repetirse entre haciendas).
- El lote debe pertenecer a la hacienda del animal (clave foránea compuesta).
- Un servicio siempre identifica toro o pajuela; en IA el inseminador es obligatorio.
- Un diagnóstico siempre cuelga de un servicio; la fecha probable de parto solo existe si resultó preñada.
- Un chequeo tiene como máximo una fila por ovario; sin CL presente no puede haber estado ni diámetro de CL.

## Siguiente paso (Módulo 2)

`AnimalesService.cambiarEstado(id, nuevoEstado, manager?)` valida la transición según
`src/common/estado-reproductivo.ts`. Los servicios de celos, servicios y diagnósticos deben llamarlo
dentro de la misma transacción que guarda el evento. Las transiciones son un punto de partida:
revísalas con el criterio del veterinario/zootecnista.

Pendiente: autenticación (JWT y roles), auditoría (`auditoria` ya existe en la base de datos), los endpoints
de chequeos, celos, servicios, diagnósticos y tratamientos con sus formularios en el frontend, y el modo
sin conexión para el potrero (PWA con cola de registros).
