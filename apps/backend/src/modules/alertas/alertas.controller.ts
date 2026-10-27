import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AlertasService } from './alertas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('alertas')
export class AlertasController {
  constructor(private readonly service: AlertasService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Patch(':id/resolver')
  resolver(@Param('id') id: string) {
    return this.service.resolver(id);
  }
}