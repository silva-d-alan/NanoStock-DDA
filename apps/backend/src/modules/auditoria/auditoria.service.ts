import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcaoAuditoria, Auditoria } from './auditoria.entity';

export interface RegistroAuditoria {
  acao: AcaoAuditoria;
  entidade: string;
  entidadeId?: string;
  usuarioId?: string;
  detalhes?: Record<string, unknown>;
}

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(Auditoria) private readonly repo: Repository<Auditoria>,
  ) {}

  registrar(registro: RegistroAuditoria) {
    return this.repo.save(this.repo.create(registro));
  }

  findAll() {
    return this.repo.find({ order: { data: 'DESC' }, take: 500 });
  }
}
