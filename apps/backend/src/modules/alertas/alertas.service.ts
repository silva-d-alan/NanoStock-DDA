import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alerta } from './alerta.entity';
import { Pastilha } from '../pastilhas/pastilha.entity';
import type { PerfilUsuario } from '@dda/shared-types';

/** RN03 – o alerta de estoque mínimo é dirigido ao Almoxarife e ao Comprador */
export const DESTINATARIOS_ALERTA: PerfilUsuario[] = ['ALMOXARIFE', 'COMPRADOR'];

/** Perfis de supervisão enxergam todos os alertas, mesmo não sendo destinatários */
const PERFIS_SUPERVISAO: string[] = ['ADMIN', 'GESTOR'];

@Injectable()
export class AlertasService {
  constructor(
    @InjectRepository(Alerta) private readonly repo: Repository<Alerta>,
  ) {}

  async findAll(perfil?: string) {
    const ativos = await this.repo.find({ where: { status: 'ATIVO' }, order: { dataGeracao: 'DESC' } });
    if (!perfil || PERFIS_SUPERVISAO.includes(perfil)) return ativos;
    return ativos.filter((a) => a.destinatarios?.includes(perfil));
  }

  async gerar(pastilha: Pastilha) {
    const existente = await this.repo.findOne({
      where: { pastilhaId: pastilha.id, status: 'ATIVO' },
    });
    if (existente) return existente;

    const situacao = pastilha.estoqueAtual === 0 ? 'zerado' : 'abaixo do mínimo';
    return this.repo.save(
      this.repo.create({
        pastilhaId: pastilha.id,
        destinatarios: [...DESTINATARIOS_ALERTA],
        mensagem: `Estoque de "${pastilha.descricao}" ${situacao} (${pastilha.estoqueAtual}/${pastilha.estoqueMinimo}).`,
      }),
    );
  }

  async resolver(id: string) {
    await this.repo.update(id, { status: 'RESOLVIDO' });
  }
}
