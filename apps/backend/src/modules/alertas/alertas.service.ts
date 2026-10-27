import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alerta } from './alerta.entity';
import { Pastilha } from '../pastilhas/pastilha.entity';

@Injectable()
export class AlertasService {
  constructor(
    @InjectRepository(Alerta) private readonly repo: Repository<Alerta>,
  ) {}

  findAll() {
    return this.repo.find({ where: { status: 'ATIVO' }, order: { dataGeracao: 'DESC' } });
  }

  async gerar(pastilha: Pastilha) {
    const existente = await this.repo.findOne({
      where: { pastilhaId: pastilha.id, status: 'ATIVO' },
    });
    if (existente) return existente;

    return this.repo.save(
      this.repo.create({
        pastilhaId: pastilha.id,
        mensagem: `Estoque de "${pastilha.descricao}" abaixo do mínimo (${pastilha.estoqueAtual}/${pastilha.estoqueMinimo}).`,
      }),
    );
  }

  async resolver(id: string) {
    await this.repo.update(id, { status: 'RESOLVIDO' });
  }
}