import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { AlertasService } from './alertas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('alertas')
export class AlertasController {
  constructor(private readonly service: AlertasService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user?.perfil);
  }

  @Patch(':id/resolver')
  resolver(@Param('id') id: string) {
    return this.service.resolver(id);
  }
}