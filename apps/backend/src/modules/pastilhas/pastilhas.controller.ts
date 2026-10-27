import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PastilhasService } from './pastilhas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { CriarPastilhaDTO } from '@dda/shared-types';

@UseGuards(JwtAuthGuard)
@Controller('pastilhas')
export class PastilhasController {
  constructor(private readonly service: PastilhasService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  criar(@Body() dto: CriarPastilhaDTO) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: Partial<CriarPastilhaDTO>) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.service.remover(id);
  }
}