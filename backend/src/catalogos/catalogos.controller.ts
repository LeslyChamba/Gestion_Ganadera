import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { CatalogosService } from './catalogos.service';

@Controller()
export class CatalogosController {
  constructor(private readonly service: CatalogosService) {}

  @Get('haciendas')
  haciendas() {
    return this.service.listarHaciendas();
  }

  @Get('haciendas/:id/lotes')
  lotes(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.listarLotes(id);
  }

  @Get('razas')
  razas() {
    return this.service.listarRazas();
  }
}
