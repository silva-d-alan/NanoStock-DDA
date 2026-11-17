import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuditoriaService } from './auditoria.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'GESTOR')
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly service: AuditoriaService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
