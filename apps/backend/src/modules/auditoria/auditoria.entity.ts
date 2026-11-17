import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type AcaoAuditoria = 'LOGIN' | 'LOGIN_FALHA' | 'ENTRADA' | 'SAIDA' | 'AJUSTE';

/** RF15 / RNF09 – log de auditoria de movimentações e acessos. */
@Entity('auditoria')
export class Auditoria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  acao: AcaoAuditoria;

  @Column({ type: 'varchar', length: 40 })
  entidade: string;

  @Column({ name: 'entidade_id', type: 'varchar', nullable: true })
  entidadeId?: string;

  @Column({ name: 'usuario_id', type: 'varchar', nullable: true })
  usuarioId?: string;

  @Column({ type: 'simple-json', nullable: true })
  detalhes?: Record<string, unknown>;

  @CreateDateColumn()
  data: Date;
}
