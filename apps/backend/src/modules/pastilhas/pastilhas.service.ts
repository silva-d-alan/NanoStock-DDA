import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Pastilha } from './pastilha.entity';
import type { CriarPastilhaDTO } from '@dda/shared-types';

@Injectable()
export class PastilhasService {
  constructor(
    @InjectRepository(Pastilha) private readonly repo: Repository<Pastilha>,
  ) {}

  findAll() {
    return this.repo.find({ where: { ativo: true }, order: { descricao: 'ASC' } });
  }

  /** RF03 – identificação por código único ou descrição */
  buscar(termo?: string) {
    const t = termo?.trim();
    if (!t) return this.findAll();
    return this.repo.find({
      where: [
        { codigo: ILike(`%${t}%`), ativo: true },
        { descricao: ILike(`%${t}%`), ativo: true },
      ],
      order: { descricao: 'ASC' },
    });
  }

  async findOne(id: string) {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Pastilha não encontrada');
    return p;
  }

  /** RF06 – quantidade disponível em tempo real */
  async saldo(id: string) {
    const p = await this.findOne(id);
    return {
      id: p.id,
      codigo: p.codigo,
      descricao: p.descricao,
      unidade: p.unidade,
      estoqueAtual: p.estoqueAtual,
      estoqueMinimo: p.estoqueMinimo,
      abaixoMinimo: p.estoqueAtual <= p.estoqueMinimo,
    };
  }

  /** RF01 / RF02 / RN06 / RN07 */
  async criar(dto: CriarPastilhaDTO) {
    if (!dto.codigo?.trim()) throw new BadRequestException('Código é obrigatório (RF01)');
    if (!dto.descricao?.trim()) throw new BadRequestException('Descrição é obrigatória (RF01)');
    if (!dto.aplicacao?.trim()) throw new BadRequestException('Aplicação é obrigatória (RF01)');
    if (!dto.fabricanteId) throw new BadRequestException('Fabricante é obrigatório (RF02)');
    const estoqueMinimo = dto.estoqueMinimo ?? 0;
    this.validarMinimo(estoqueMinimo);

    // Itens excluídos continuam na tabela (ativo = false), então o código segue ocupado.
    const codigo = dto.codigo.trim();
    const existente = await this.repo.findOne({ where: { codigo } });
    if (existente) {
      throw new ConflictException('Código já utilizado e não pode ser reutilizado (RN06)');
    }

    return this.repo.save(
      this.repo.create({
        codigo,
        descricao: dto.descricao.trim(),
        aplicacao: dto.aplicacao.trim(),
        unidade: dto.unidade?.trim() || 'UN',
        fabricanteId: dto.fabricanteId,
        estoqueMinimo,
        estoqueAtual: 0,
        ativo: true,
      }),
    );
  }

  async atualizar(id: string, dto: Partial<CriarPastilhaDTO>) {
    const p = await this.findOne(id);
    if (dto.codigo !== undefined && dto.codigo.trim() !== p.codigo) {
      throw new BadRequestException('O código do item não pode ser alterado (RN06)');
    }
    if (dto.estoqueMinimo !== undefined) this.validarMinimo(dto.estoqueMinimo);

    if (dto.descricao !== undefined) p.descricao = dto.descricao;
    if (dto.aplicacao !== undefined) p.aplicacao = dto.aplicacao;
    if (dto.unidade !== undefined) p.unidade = dto.unidade;
    if (dto.estoqueMinimo !== undefined) p.estoqueMinimo = dto.estoqueMinimo;
    if (dto.fabricanteId !== undefined && dto.fabricanteId !== p.fabricanteId) {
      p.fabricanteId = dto.fabricanteId;
      // a relação eager carregada ainda aponta para o fabricante antigo e
      // teria precedência sobre a coluna no save
      delete (p as Partial<Pastilha>).fabricante;
    }
    return this.repo.save(p);
  }

  /** RF07 / RN07 – estoque mínimo configurável por item */
  async definirEstoqueMinimo(id: string, minimo: number) {
    this.validarMinimo(minimo);
    const p = await this.findOne(id);
    p.estoqueMinimo = minimo;
    return this.repo.save(p);
  }

  /** RN06 – exclusão lógica: o registro permanece e o código nunca é liberado */
  async remover(id: string) {
    const p = await this.findOne(id);
    p.ativo = false;
    return this.repo.save(p);
  }

  /** RN01 / RN04 / RN10 – aplica o delta e devolve o item com o novo saldo */
  async ajustarEstoque(id: string, delta: number) {
    const p = await this.findOne(id);
    if (!p.ativo) throw new BadRequestException('Item inativo não pode ser movimentado');
    if (delta < 0 && p.estoqueAtual === 0) {
      throw new BadRequestException('Item com estoque zerado está bloqueado para saída (RN04)');
    }
    const novoSaldo = p.estoqueAtual + delta;
    if (novoSaldo < 0) throw new BadRequestException('Estoque insuficiente (RN01)');
    p.estoqueAtual = novoSaldo;
    return this.repo.save(p);
  }

  private validarMinimo(minimo: number) {
    if (!Number.isInteger(minimo) || minimo < 0) {
      throw new BadRequestException('Estoque mínimo deve ser um inteiro maior ou igual a zero (RN07)');
    }
  }
}
