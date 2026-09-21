import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateAnimalDto } from './create-animal.dto';

/** La hacienda no se puede cambiar; el estado reproductivo solo lo modifica el backend. */
export class UpdateAnimalDto extends PartialType(OmitType(CreateAnimalDto, ['haciendaId'] as const)) {}
