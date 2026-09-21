import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('lotes')
export class Lote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hacienda_id', type: 'uuid' })
  haciendaId: string;

  @Column({ type: 'text' })
  nombre: string;
}
