import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import type { PerfilUsuario } from '@dda/shared-types';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  nome: string;

  @Column({ unique: true, length: 120 })
  email: string;

  @Column()
  senhaHash: string;

  @Column({ type: 'varchar', length: 20, default: 'ALMOXARIFE' })
  perfil: PerfilUsuario;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn()
  criadoEm: Date;
}