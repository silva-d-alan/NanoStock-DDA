import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { FabricantesService } from './fabricantes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Fabricante } from './fabricante.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fabricantes')
export class FabricantesController {
  constructor(private readonly service: FabricantesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'ALMOXARIFE', 'COMPRADOR')
  criar(@Body() dto: Partial<Fabricante>) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ALMOXARIFE', 'COMPRADOR')
  atualizar(@Param('id') id: string, @Body() dto: Partial<Fabricante>) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'ALMOXARIFE', 'COMPRADOR')
  remover(@Param('id') id: string) {
    return this.service.remover(id);
  }
}