import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PastilhasService } from './pastilhas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { CriarPastilhaDTO } from '@dda/shared-types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pastilhas')
export class PastilhasController {
  constructor(private readonly service: PastilhasService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  // rotas fixas antes de ':id'
  @Get('busca')
  buscar(@Query('termo') termo?: string) {
    return this.service.buscar(termo);
  }

  @Get(':id/saldo')
  saldo(@Param('id') id: string) {
    return this.service.saldo(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'ALMOXARIFE', 'COMPRADOR')
  criar(@Body() dto: CriarPastilhaDTO) {
    return this.service.criar(dto);
  }

  @Patch(':id/estoque-minimo')
  @Roles('ADMIN', 'ALMOXARIFE', 'COMPRADOR')
  definirEstoqueMinimo(@Param('id') id: string, @Body('estoqueMinimo') estoqueMinimo: number) {
    return this.service.definirEstoqueMinimo(id, estoqueMinimo);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ALMOXARIFE', 'COMPRADOR')
  atualizar(@Param('id') id: string, @Body() dto: Partial<CriarPastilhaDTO>) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'ALMOXARIFE', 'COMPRADOR')
  remover(@Param('id') id: string) {
    return this.service.remover(id);
  }
}
