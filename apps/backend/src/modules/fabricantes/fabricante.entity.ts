import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Pastilha } from '../pastilhas/pastilha.entity';

@Entity('fabricantes')
export class Fabricante {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  nome: string;

  @Column({ length: 18, nullable: true })
  cnpj?: string;

  @Column({ length: 120, nullable: true })
  contato?: string;

  @OneToMany(() => Pastilha, (p) => p.fabricante)
  pastilhas: Pastilha[];
}