import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pastilha } from '../pastilhas/pastilha.entity';
import { Movimentacao } from '../movimentacoes/movimentacao.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Pastilha) private readonly pastilhasRepo: Repository<Pastilha>,
    @InjectRepository(Movimentacao) private readonly movRepo: Repository<Movimentacao>,
  ) {}

  /** RF10 / RN04 – situação geral do estoque, com os itens zerados em destaque */
  async resumo() {
    const itens = await this.pastilhasRepo.find({ where: { ativo: true }, order: { descricao: 'ASC' } });
    // críticos = no mínimo ou abaixo dele (inclui os zerados)
    const itensCriticos = itens.filter((p) => p.estoqueAtual <= p.estoqueMinimo);
    const itensZerados = itens.filter((p) => p.estoqueAtual === 0);

    const movimentacoesRecentes = await this.movRepo.find({
      order: { data: 'DESC' },
      take: 5,
    });

    return {
      totalPastilhas: itens.length,
      totalUnidades: itens.reduce((soma, p) => soma + p.estoqueAtual, 0),
      totalCriticos: itensCriticos.length,
      itensCriticos,
      totalZerados: itensZerados.length,
      itensZerados,
      movimentacoesRecentes,
    };
  }
}
