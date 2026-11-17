import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RelatoriosService } from './relatorios.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ALMOXARIFE', 'COMPRADOR', 'GESTOR')
@Controller('relatorios')
export class RelatoriosController {
  constructor(private readonly service: RelatoriosService) {}

  @Get('consumo')
  consumo(@Query('dias') dias?: string) {
    return this.service.consumo(Number(dias));
  }

  @Get('consumo/csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="consumo.csv"')
  async consumoCsv(@Query('dias') dias?: string) {
    const r = await this.service.consumo(Number(dias));
    return this.service.toCsv(
      r.itens.map((i) => ({
        codigo: i.codigo,
        descricao: i.descricao,
        producao: i.porDestino.PRODUCAO ?? 0,
        manutencao: i.porDestino.MANUTENCAO ?? 0,
        terceiros: i.porDestino.TERCEIROS ?? 0,
        total: i.total,
      })),
    );
  }

  @Get('reposicao')
  reposicao() {
    return this.service.reposicao();
  }

  @Get('reposicao/csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="reposicao.csv"')
  async reposicaoCsv() {
    const itens = await this.service.reposicao();
    return this.service.toCsv(itens.map(({ id: _id, ...resto }) => resto));
  }

  @Get('movimentacao')
  movimentacao(@Query('inicio') inicio: string, @Query('fim') fim: string) {
    return this.service.movimentacao(new Date(inicio), new Date(fim));
  }
}
