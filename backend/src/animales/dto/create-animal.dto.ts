import { Transform } from 'class-transformer';
import { IsISO8601, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
/**
 * Convierte '' en null: los campos opcionales vacíos no fallan la validación
 * y, al editar, permiten borrar un valor (ej. quitar el nombre).
 */
const vacioANull = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const v = value.trim();
  return v === '' ? null : v;
};

export class CreateAnimalDto {
  @IsUUID()
  haciendaId: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  arete: string;

  @IsOptional()
  @Transform(vacioANull)
  @IsString()
  @MaxLength(30)
  codigo?: string;

  @IsOptional()
  @Transform(vacioANull)
  @IsString()
  @MaxLength(80)
  nombre?: string;

  @IsOptional()
  @IsUUID()
  razaId?: string;

  @IsOptional()
  @IsUUID()
  loteId?: string;

  /** Formato YYYY-MM-DD */
  @IsOptional()
  @IsISO8601({ strict: true })
  fechaNacimiento?: string;

  @IsOptional()
  @IsUUID()
  madreId?: string;

  @IsOptional()
  @Transform(vacioANull)
  @IsString()
  @MaxLength(1000)
  observaciones?: string;
}
