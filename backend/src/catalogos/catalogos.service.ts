import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hacienda } from './entities/hacienda.entity';
import { Lote } from './entities/lote.entity';
import { Raza } from './entities/raza.entity';

@Injectable()
export class CatalogosService {
  constructor(
    @InjectRepository(Hacienda) private readonly haciendas: Repository<Hacienda>,
    @InjectRepository(Lote) private readonly lotes: Repository<Lote>,
    @InjectRepository(Raza) private readonly razas: Repository<Raza>,
  ) {}

  listarHaciendas(): Promise<Hacienda[]> {
    return this.haciendas.find({ order: { nombre: 'ASC' } });
  }

  async listarLotes(haciendaId: string): Promise<Lote[]> {
    const existe = await this.haciendas.existsBy({ id: haciendaId });
    if (!existe) throw new NotFoundException('Hacienda no encontrada');
    return this.lotes.find({ where: { haciendaId }, order: { nombre: 'ASC' } });
  }

  listarRazas(): Promise<Raza[]> {
    return this.razas.find({ order: { nombre: 'ASC' } });
  }
}
