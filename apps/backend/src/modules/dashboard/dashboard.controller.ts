import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pastilha } from '../pastilhas/pastilha.entity';
import { Movimentacao } from '../movimentacoes/movimentacao.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard) // <-- ESSA LINHA É CRUCIAL
@Controller('dashboard')
export class DashboardController {
  constructor(
    @InjectRepository(Pastilha) private pastilhasRepo: Repository<Pastilha>,
    @InjectRepository(Movimentacao) private movRepo: Repository<Movimentacao>,
  ) {}

  @Get()
  async resumo() {
    const totalPastilhas = await this.pastilhasRepo.count();
    
    // Busca itens abaixo ou iguais ao estoque mínimo
    const criticos = await this.pastilhasRepo
      .createQueryBuilder('p')
      .where('p.estoqueAtual <= p.estoqueMinimo')
      .getMany();

    // Pega as últimas 5 movimentações
    const movimentacoesRecentes = await this.movRepo.find({
      order: { data: 'DESC' },
      take: 5,
    });

    return {
      totalPastilhas,
      totalCriticos: criticos.length,
      itensCriticos: criticos,
      movimentacoesRecentes,
    };
  }
}