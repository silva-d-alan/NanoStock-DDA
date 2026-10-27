import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pastilha } from './pastilha.entity';
import type { CriarPastilhaDTO } from '@dda/shared-types';

@Injectable()
export class PastilhasService {
  constructor(
    @InjectRepository(Pastilha) private readonly repo: Repository<Pastilha>,
  ) {}

  findAll() {
    return this.repo.find({ order: { descricao: 'ASC' } });
  }

  async findOne(id: string) {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Pastilha não encontrada');
    return p;
  }

  criar(dto: CriarPastilhaDTO) {
    const p = this.repo.create({ ...dto, estoqueAtual: 0 });
    return this.repo.save(p);
  }

  async atualizar(id: string, dto: Partial<CriarPastilhaDTO>) {
    const p = await this.findOne(id);
    Object.assign(p, dto);
    return this.repo.save(p);
  }

  async remover(id: string) {
    const p = await this.findOne(id);
    return this.repo.remove(p);
  }

  async ajustarEstoque(id: string, delta: number) {
    const p = await this.findOne(id);
    const novoSaldo = p.estoqueAtual + delta;
    if (novoSaldo < 0) throw new BadRequestException('Estoque insuficiente (RN01)');
    p.estoqueAtual = novoSaldo;
    return this.repo.save(p);
  }
}