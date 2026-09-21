import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogosController } from './catalogos.controller';
import { CatalogosService } from './catalogos.service';
import { Hacienda } from './entities/hacienda.entity';
import { Lote } from './entities/lote.entity';
import { Raza } from './entities/raza.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hacienda, Lote, Raza])],
  controllers: [CatalogosController],
  providers: [CatalogosService],
  exports: [TypeOrmModule],
})
export class CatalogosModule {}
