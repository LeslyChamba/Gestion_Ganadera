import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Animal } from '../animales/animal.entity';
import { LineaTiempoDto, TipoEvento } from './timeline.dto';

interface Fila {
  id: string;
  tipo: TipoEvento;
  fechaHora: string;
  cursorFecha: string;
  detalle: Record<string, unknown>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FECHA_MICRO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;

@Injectable()
export class TimelineService {
  constructor(@InjectRepository(Animal) private readonly animales: Repository<Animal>) {}

  /**
   * Historial del animal, del evento más reciente al más antiguo.
   * Paginación por cursor (fecha + id): estable aunque se registren eventos nuevos mientras se pagina.
   */
  async listar(animalId: string, { cursor, tipos, limit = 20 }: LineaTiempoDto) {
    if (!(await this.animales.existsBy({ id: animalId }))) {
      throw new NotFoundException('Animal no encontrado');
    }

    const params: unknown[] = [animalId];
    const condiciones = ['animal_id = $1'];

    if (tipos?.length) {
      params.push(tipos);
      condiciones.push(`tipo = ANY($${params.length}::text[])`);
    }
    if (cursor) {
      const { f, i } = this.decodificar(cursor);
      params.push(f, i);
      condiciones.push(`(fecha_hora, ref_id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
    }
    params.push(limit + 1); // uno de más para saber si hay otra página

    const filas: Fila[] = await this.animales.query(
      `SELECT ref_id AS id,
              tipo,
              fecha_hora AS "fechaHora",
              to_char(fecha_hora AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "cursorFecha",
              detalle
         FROM v_linea_tiempo
        WHERE ${condiciones.join(' AND ')}
        ORDER BY fecha_hora DESC, ref_id DESC
        LIMIT $${params.length}`,
      params,
    );

    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const ultimo = pagina[pagina.length - 1];

    return {
      items: pagina.map(({ id, tipo, fechaHora, detalle }) => ({ id, tipo, fechaHora, detalle })),
      nextCursor: hayMas && ultimo ? this.codificar(ultimo.cursorFecha, ultimo.id) : null,
    };
  }

  private codificar(fecha: string, id: string): string {
    return Buffer.from(JSON.stringify({ f: fecha, i: id })).toString('base64url');
  }

  private decodificar(cursor: string): { f: string; i: string } {
    try {
      const { f, i } = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
      if (typeof f === 'string' && FECHA_MICRO.test(f) && typeof i === 'string' && UUID.test(i)) {
        return { f, i };
      }
    } catch {
      /* cae al error de abajo */
    }
    throw new BadRequestException('El cursor de paginación no es válido.');
  }
}
