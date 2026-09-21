import { BadRequestException, ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

/**
 * Traduce errores comunes de PostgreSQL a respuestas HTTP claras.
 *  23505 = unique_violation, 23503 = foreign_key_violation, 23514 = check_violation
 */
export function traducirErrorDb(error: unknown, mensajes: Partial<Record<string, string>> = {}): never {
  if (error instanceof QueryFailedError) {
    const code = (error as QueryFailedError & { code?: string }).code;
    const detalle = mensajes[code ?? ''];
    if (code === '23505') {
      throw new ConflictException(detalle ?? 'Ya existe un registro con esos datos.');
    }
    if (code === '23503') {
      throw new BadRequestException(detalle ?? 'Una de las referencias indicadas no existe o no es válida.');
    }
    if (code === '23514') {
      throw new BadRequestException(detalle ?? 'Los datos no cumplen las reglas de validación.');
    }
  }
  throw error;
}
