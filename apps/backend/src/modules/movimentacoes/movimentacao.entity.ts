import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Pastilha } from '../pastilhas/pastilha.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('movimentacoes')
export class Movimentacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  tipo: 'ENTRADA' | 'SAIDA';

  @Column({ type: 'int' })
  quantidade: number;

  @Column({ type: 'text', nullable: true })
  observacao?: string;

  @ManyToOne(() => Pastilha, (p) => p.movimentacoes, { eager: true })
  @JoinColumn({ name: 'pastilha_id' })
  pastilha: Pastilha;

  @Column({ name: 'pastilha_id' })
  pastilhaId: string;

  @ManyToOne(() => Usuario, { eager: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'usuario_id' })
  usuarioId: string;

  @CreateDateColumn()
  data: Date;
}