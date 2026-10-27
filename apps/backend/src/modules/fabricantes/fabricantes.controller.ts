import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { FabricantesService } from './fabricantes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Fabricante } from './fabricante.entity';

@UseGuards(JwtAuthGuard)
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
  criar(@Body() dto: Partial<Fabricante>) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: Partial<Fabricante>) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.service.remover(id);
  }
}