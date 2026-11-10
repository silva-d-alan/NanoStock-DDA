import { Body, Controller, Get, Post, Patch, Delete, Param, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Post()
  criar(@Body() dados: any) {
    return this.service.criar(dados);
  }

  @Get()
  listar() {
    return this.service.findAll();
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dados: any) {
    return this.service.atualizar(id, dados);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.service.remover(id);
  }
}