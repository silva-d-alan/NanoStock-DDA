import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { MovimentacoesService } from './movimentacoes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { CriarMovimentacaoDTO } from '@dda/shared-types';

@UseGuards(JwtAuthGuard)
@Controller('movimentacoes')
export class MovimentacoesController {
  constructor(private readonly service: MovimentacoesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  registrar(@Body() dto: CriarMovimentacaoDTO, @Req() req: any) {
    return this.service.registrar(dto, req.user.id);
  }
}