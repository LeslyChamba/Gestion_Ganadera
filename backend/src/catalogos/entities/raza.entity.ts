import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('razas')
export class Raza {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  nombre: string;
}
