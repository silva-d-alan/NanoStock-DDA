import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { MovimentacoesService } from './movimentacoes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AjusteInventarioDto, CriarMovimentacaoDto } from './dto/movimentacao.dto';
import type { TipoMovimentacao } from '@dda/shared-types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('movimentacoes')
export class MovimentacoesController {
  constructor(private readonly service: MovimentacoesService) {}

  @Get()
  findAll(@Query('pastilhaId') pastilhaId?: string, @Query('tipo') tipo?: TipoMovimentacao) {
    return this.service.findAll({ pastilhaId, tipo });
  }

  @Post()
  @Roles('ADMIN', 'ALMOXARIFE')
  registrar(@Body() dto: CriarMovimentacaoDto, @Req() req: any) {
    return this.service.registrar(dto, req.user?.id);
  }

  @Post('ajuste')
  @Roles('ADMIN', 'ALMOXARIFE')
  ajustar(@Body() dto: AjusteInventarioDto, @Req() req: any) {
    return this.service.ajustarInventario(dto, req.user?.id);
  }
}
