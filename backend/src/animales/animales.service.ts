import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { calcularEdad } from '../common/edad';
import { traducirErrorDb } from '../common/db-errors';
import { EstadoReproductivo, puedeTransicionar } from '../common/estado-reproductivo';
import { escaparLike, normalizarBusqueda } from '../common/texto';
import { Animal } from './animal.entity';
import { BuscarAnimalesDto } from './dto/buscar-animales.dto';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { ListarAnimalesDto } from './dto/listar-animales.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';

interface BusquedaItem {
  id: string;
  arete: string;
  codigo: string | null;
  nombre: string | null;
  estadoReproductivo: EstadoReproductivo;
  lote: string | null;
  raza: string | null;
}

const MENSAJES_DB = {
  '23505': 'Ya existe un animal con ese arete o código en esta hacienda.',
  '23503': 'La raza, el lote o la madre indicada no existe (el lote debe pertenecer a la hacienda del animal).',
  '23514': 'La fecha de nacimiento no puede ser futura.',
};

@Injectable()
export class AnimalesService {
  constructor(@InjectRepository(Animal) private readonly repo: Repository<Animal>) {}

  // ------------------------------------------------------------------
  //  Buscador: arete / código / nombre sobre animales.busqueda (índice GIN).
  //  Fase 1: coincidencia parcial (rápida, casi siempre suficiente).
  //  Fase 2: solo si faltan resultados, tolera errores de escritura.
  //  Orden: arete/código exacto > empieza con > resto.
  // ------------------------------------------------------------------
  async buscar({ q, haciendaId, limit = 20 }: BuscarAnimalesDto) {
    const norm = normalizarBusqueda(q);
    const esc = escaparLike(norm);
    const contiene = `%${esc}%`;
    const empieza = `${esc}%`;

    const SELECT = `
      SELECT a.id,
             a.arete,
             a.codigo,
             a.nombre,
             a.estado_reproductivo AS "estadoReproductivo",
             l.nombre              AS lote,
             r.nombre              AS raza
        FROM animales a
        LEFT JOIN lotes l ON l.id = a.lote_id
        LEFT JOIN razas r ON r.id = a.raza_id`;

    const exactos: BusquedaItem[] = await this.repo.query(
      `${SELECT}
       WHERE a.hacienda_id = $1 AND a.activo AND a.busqueda LIKE $3
       ORDER BY (lower(a.arete) = $2 OR lower(a.codigo) = $2)                             DESC,
                (lower(a.arete) LIKE $4 OR lower(a.codigo) LIKE $4
                 OR f_unaccent(lower(a.nombre)) LIKE $4)                                   DESC,
                a.arete
       LIMIT $5`,
      [haciendaId, norm, contiene, empieza, limit],
    );
    // La tolerancia a errores solo aplica a texto (nombres); en aretes/códigos numéricos
    // devolvería animales distintos (0102 al buscar 0101), lo cual confunde en el potrero.
    const tieneTexto = /\p{L}{3,}/u.test(norm);
    if (exactos.length >= limit || !tieneTexto) return exactos;

    // Fase 2: parecidos (ej. "margarta" -> "Margarita")
    const parecidos: BusquedaItem[] = await this.repo.query(
      `${SELECT}
       WHERE a.hacienda_id = $1 AND a.activo
         AND $2 <% a.busqueda AND NOT (a.busqueda LIKE $3)
       ORDER BY $2 <<-> a.busqueda, a.arete
       LIMIT $4`,
      [haciendaId, norm, contiene, limit - exactos.length],
    );
    return [...exactos, ...parecidos];
  }

  // ------------------------------------------------------------------
  //  Listado paginado por hacienda (y opcionalmente por lote)
  // ------------------------------------------------------------------
  async listar({ haciendaId, loteId, page = 1, pageSize = 25 }: ListarAnimalesDto) {
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.lote', 'l')
      .leftJoinAndSelect('a.raza', 'r')
      .where('a.haciendaId = :haciendaId', { haciendaId })
      .andWhere('a.activo = true')
      .orderBy('a.arete', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (loteId) qb.andWhere('a.loteId = :loteId', { loteId });

    const [animales, total] = await qb.getManyAndCount();
    return {
      items: animales.map((a) => ({
        id: a.id,
        arete: a.arete,
        codigo: a.codigo,
        nombre: a.nombre,
        lote: a.lote?.nombre ?? null,
        raza: a.raza?.nombre ?? null,
        edad: calcularEdad(a.fechaNacimiento),
        estadoReproductivo: a.estadoReproductivo,
      })),
      total,
      page,
      pageSize,
    };
  }

  // ------------------------------------------------------------------
  //  Ficha técnica: datos básicos + estado + resumen reproductivo
  // ------------------------------------------------------------------
  async obtenerFicha(id: string) {
    const animal = await this.repo.findOne({
      where: { id },
      relations: { hacienda: true, lote: true, raza: true },
    });
    if (!animal) throw new NotFoundException('Animal no encontrado');

    const [resumen] = await this.repo.query(
      `
      SELECT
        (SELECT MAX(fecha_hora) FROM chequeos WHERE animal_id = $1) AS "ultimoChequeo",
        (SELECT MAX(fecha_hora) FROM celos    WHERE animal_id = $1) AS "ultimoCelo",
        (SELECT jsonb_build_object('fechaHora', s.fecha_hora, 'tipo', s.tipo,
                                   'toro', t.nombre, 'codigoPajuela', s.codigo_pajuela)
           FROM servicios s
           LEFT JOIN toros t ON t.id = s.toro_id
          WHERE s.animal_id = $1
          ORDER BY s.fecha_hora DESC LIMIT 1)                        AS "ultimoServicio",
        (SELECT jsonb_build_object('fechaHora', d.fecha_hora, 'resultado', d.resultado,
                                   'fechaProbableParto', d.fecha_probable_parto)
           FROM diagnosticos_prenez d
          WHERE d.animal_id = $1
          ORDER BY d.fecha_hora DESC LIMIT 1)                        AS "ultimoDiagnostico"
      `,
      [id],
    );

    return {
      id: animal.id,
      arete: animal.arete,
      codigo: animal.codigo,
      nombre: animal.nombre,
      fechaNacimiento: animal.fechaNacimiento,
      edad: calcularEdad(animal.fechaNacimiento),
      hacienda: { id: animal.hacienda!.id, nombre: animal.hacienda!.nombre },
      lote: animal.lote ? { id: animal.lote.id, nombre: animal.lote.nombre } : null,
      raza: animal.raza ? { id: animal.raza.id, nombre: animal.raza.nombre } : null,
      madreId: animal.madreId,
      estadoReproductivo: animal.estadoReproductivo,
      estadoActualizadoAt: animal.estadoActualizadoAt,
      activo: animal.activo,
      observaciones: animal.observaciones,
      resumenReproductivo: resumen,
    };
  }

  // ------------------------------------------------------------------
  //  Crear / actualizar / baja lógica
  // ------------------------------------------------------------------
  async crear(dto: CreateAnimalDto) {
    if (dto.madreId) await this.validarMadre(dto.madreId, dto.haciendaId);
    try {
      const animal = await this.repo.save(this.repo.create(dto));
      return this.obtenerFicha(animal.id);
    } catch (e) {
      traducirErrorDb(e, MENSAJES_DB);
    }
  }

  async actualizar(id: string, dto: UpdateAnimalDto) {
    const animal = await this.repo.findOneBy({ id });
    if (!animal) throw new NotFoundException('Animal no encontrado');
    if (dto.madreId) {
      if (dto.madreId === id) throw new BadRequestException('Un animal no puede ser su propia madre.');
      await this.validarMadre(dto.madreId, animal.haciendaId);
    }
    try {
      Object.assign(animal, dto);
      await this.repo.save(animal);
      return this.obtenerFicha(id);
    } catch (e) {
      traducirErrorDb(e, MENSAJES_DB);
    }
  }

  /** Baja lógica: el historial reproductivo se conserva. */
  async darDeBaja(id: string): Promise<void> {
    const res = await this.repo.update({ id }, { activo: false });
    if (!res.affected) throw new NotFoundException('Animal no encontrado');
  }

  // ------------------------------------------------------------------
  //  Uso interno del Módulo 2: cambia el estado validando la transición.
  //  Pasa el `manager` de la transacción para hacerlo atómico con el evento.
  // ------------------------------------------------------------------
  async cambiarEstado(id: string, nuevo: EstadoReproductivo, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(Animal) : this.repo;
    const animal = await repo.findOneBy({ id });
    if (!animal) throw new NotFoundException('Animal no encontrado');
    if (!puedeTransicionar(animal.estadoReproductivo, nuevo)) {
      throw new ConflictException(
        `No se puede pasar de ${animal.estadoReproductivo} a ${nuevo}. Revisa el historial del animal.`,
      );
    }
    if (animal.estadoReproductivo !== nuevo) {
      await repo.update({ id }, { estadoReproductivo: nuevo, estadoActualizadoAt: new Date() });
    }
  }

  private async validarMadre(madreId: string, haciendaId: string) {
    const madre = await this.repo.findOneBy({ id: madreId, haciendaId });
    if (!madre) throw new BadRequestException('La madre indicada no existe en esta hacienda.');
  }
}
