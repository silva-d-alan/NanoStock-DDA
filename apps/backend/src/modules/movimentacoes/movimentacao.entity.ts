import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Pastilha } from '../pastilhas/pastilha.entity';
import { Usuario } from '../usuarios/usuario.entity';
import type { DestinoSaida, TipoMovimentacao } from '@dda/shared-types';

@Entity('movimentacoes')
export class Movimentacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  tipo: TipoMovimentacao;

  @Column({ type: 'int' })
  quantidade: number;

  /** RF04 – preenchida nas entradas */
  @Column({ name: 'nota_fiscal', type: 'varchar', length: 60, nullable: true })
  notaFiscal?: string;

  /** RF05 / RN09 – preenchido nas saídas */
  @Column({ type: 'varchar', length: 20, nullable: true })
  destino?: DestinoSaida;

  /** RF14 / RN05 – preenchida nos ajustes manuais */
  @Column({ type: 'text', nullable: true })
  justificativa?: string;

  /** RN10 – saldo do item antes e depois da movimentação (nulos em registros antigos) */
  @Column({ name: 'saldo_anterior', type: 'int', nullable: true })
  saldoAnterior?: number;

  @Column({ name: 'saldo_apos', type: 'int', nullable: true })
  saldoApos?: number;

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
