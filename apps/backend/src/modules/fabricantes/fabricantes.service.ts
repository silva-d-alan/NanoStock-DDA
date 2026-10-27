import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fabricante } from './fabricante.entity';

@Injectable()
export class FabricantesService {
  constructor(
    @InjectRepository(Fabricante) private readonly repo: Repository<Fabricante>,
  ) {}

  findAll() {
    return this.repo.find({ order: { nome: 'ASC' } });
  }

  async findOne(id: string) {
    const f = await this.repo.findOne({ where: { id } });
    if (!f) throw new NotFoundException('Fabricante não encontrado');
    return f;
  }

  criar(dto: Partial<Fabricante>) {
    return this.repo.save(this.repo.create(dto));
  }

  async atualizar(id: string, dto: Partial<Fabricante>) {
    const f = await this.findOne(id);
    Object.assign(f, dto);
    return this.repo.save(f);
  }

  async remover(id: string) {
    const f = await this.findOne(id);
    return this.repo.remove(f);
  }
}