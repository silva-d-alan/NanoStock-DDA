import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Pastilha } from '../pastilhas/pastilha.entity';

@Entity('alertas')
export class Alerta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Pastilha, { eager: true })
  @JoinColumn({ name: 'pastilha_id' })
  pastilha: Pastilha;

  @Column({ name: 'pastilha_id' })
  pastilhaId: string;

  @Column({ type: 'text' })
  mensagem: string;

  @Column({ type: 'varchar', length: 20, default: 'ATIVO' })
  status: 'ATIVO' | 'RESOLVIDO';

  @CreateDateColumn()
  dataGeracao: Date;
}