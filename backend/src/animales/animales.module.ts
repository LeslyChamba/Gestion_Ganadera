import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimalesController } from './animales.controller';
import { AnimalesService } from './animales.service';
import { Animal } from './animal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Animal])],
  controllers: [AnimalesController],
  providers: [AnimalesService],
  exports: [AnimalesService], // los módulos de chequeos, celos, servicios... lo usarán para cambiar el estado
})
export class AnimalesModule {}
