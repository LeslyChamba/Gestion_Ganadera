import { Transform, Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const TIPOS_EVENTO = ['CHEQUEO', 'CELO', 'SERVICIO', 'DIAGNOSTICO', 'TRATAMIENTO'] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export class LineaTiempoDto {
  /** Cursor devuelto por la página anterior (`nextCursor`) */
  @IsOptional()
  @IsString()
  cursor?: string;

  /** Filtro por tipo, separado por comas: CHEQUEO,CELO */
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean) : value,
  )
  @IsArray()
  @ArrayUnique()
  @IsIn(TIPOS_EVENTO, { each: true })
  tipos?: TipoEvento[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
