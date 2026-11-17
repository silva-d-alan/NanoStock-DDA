import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
    if (!f) throw new NotFoundException('Fornecedor não encontrado');
    return f;
  }

  /** RF02 */
  criar(dto: Partial<Fabricante>) {
    if (!dto.nome?.trim()) throw new BadRequestException('Nome do fornecedor é obrigatório (RF02)');
    return this.repo.save(this.repo.create({ ...dto, nome: dto.nome.trim() }));
  }

  async atualizar(id: string, dto: Partial<Fabricante>) {
    const f = await this.findOne(id);
    Object.assign(f, dto);
    return this.repo.save(f);
  }

  async remover(id: string) {
    const f = await this.repo.findOne({ where: { id }, relations: { pastilhas: true } });
    if (!f) throw new NotFoundException('Fornecedor não encontrado');
    // RF02 – o vínculo com os itens de estoque não pode ficar órfão
    if (f.pastilhas?.length) {
      throw new ConflictException('Fornecedor vinculado a itens de estoque não pode ser excluído (RF02)');
    }
    return this.repo.remove(f);
  }
}