import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AnimalesService } from './animales.service';
import { BuscarAnimalesDto } from './dto/buscar-animales.dto';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { ListarAnimalesDto } from './dto/listar-animales.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';

@Controller('animales')
export class AnimalesController {
  constructor(private readonly service: AnimalesService) {}

  // Debe ir ANTES de ':id' para que "buscar" no se interprete como un id
  @Get('buscar')
  buscar(@Query() query: BuscarAnimalesDto) {
    return this.service.buscar(query);
  }

  @Get()
  listar(@Query() query: ListarAnimalesDto) {
    return this.service.listar(query);
  }

  @Get(':id')
  ficha(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.obtenerFicha(id);
  }

  @Post()
  crear(@Body() dto: CreateAnimalDto) {
    return this.service.crear(dto);
  }

  @Patch(':id')
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAnimalDto) {
    return this.service.actualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  darDeBaja(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.darDeBaja(id);
  }
}
