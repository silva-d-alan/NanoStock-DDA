import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Fabricante } from '../fabricantes/fabricante.entity';
import { Movimentacao } from '../movimentacoes/movimentacao.entity';

@Entity('pastilhas')
export class Pastilha {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 60 })
  codigo: string;

  @Column({ length: 200 })
  descricao: string;

  @Column({ length: 200 })
  aplicacao: string;

  @Column({ length: 20, default: 'UN' })
  unidade: string;

  @Column({ type: 'int', default: 0 })
  estoqueMinimo: number;

  @Column({ type: 'int', default: 0 })
  estoqueAtual: number;

  @ManyToOne(() => Fabricante, (f) => f.pastilhas, { eager: true })
  @JoinColumn({ name: 'fabricante_id' })
  fabricante: Fabricante;

  @Column({ name: 'fabricante_id' })
  fabricanteId: string;

  @OneToMany(() => Movimentacao, (m) => m.pastilha)
  movimentacoes: Movimentacao[];
}