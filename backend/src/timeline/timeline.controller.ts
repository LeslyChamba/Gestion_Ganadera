import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { LineaTiempoDto } from './timeline.dto';
import { TimelineService } from './timeline.service';

@Controller('animales')
export class TimelineController {
  constructor(private readonly service: TimelineService) {}

  @Get(':id/linea-tiempo')
  lineaTiempo(@Param('id', ParseUUIDPipe) id: string, @Query() query: LineaTiempoDto) {
    return this.service.listar(id, query);
  }
}
