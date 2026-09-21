import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoReproductivo } from '../common/estado-reproductivo';
import { Hacienda } from '../catalogos/entities/hacienda.entity';
import { Lote } from '../catalogos/entities/lote.entity';
import { Raza } from '../catalogos/entities/raza.entity';

@Entity('animales')
export class Animal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hacienda_id', type: 'uuid' })
  haciendaId: string;

  @ManyToOne(() => Hacienda)
  @JoinColumn({ name: 'hacienda_id' })
  hacienda?: Hacienda;

  @Column({ name: 'lote_id', type: 'uuid', nullable: true })
  loteId: string | null;

  @ManyToOne(() => Lote, { nullable: true })
  @JoinColumn({ name: 'lote_id' })
  lote?: Lote | null;

  @Column({ name: 'raza_id', type: 'uuid', nullable: true })
  razaId: string | null;

  @ManyToOne(() => Raza, { nullable: true })
  @JoinColumn({ name: 'raza_id' })
  raza?: Raza | null;

  @Column({ type: 'text' })
  arete: string;

  @Column({ type: 'text', nullable: true })
  codigo: string | null;

  @Column({ type: 'text', nullable: true })
  nombre: string | null;

  /** 'YYYY-MM-DD' */
  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento: string | null;

  @Column({ name: 'madre_id', type: 'uuid', nullable: true })
  madreId: string | null;

  @Column({
    name: 'estado_reproductivo',
    type: 'enum',
    enum: EstadoReproductivo,
    enumName: 'estado_reproductivo',
    default: EstadoReproductivo.SIN_DATOS,
  })
  estadoReproductivo: EstadoReproductivo;

  @Column({ name: 'estado_actualizado_at', type: 'timestamptz' })
  estadoActualizadoAt: Date;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
