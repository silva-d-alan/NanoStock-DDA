import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movimentacao } from '../movimentacoes/movimentacao.entity';
import { Pastilha } from '../pastilhas/pastilha.entity';
import { RelatoriosController } from './relatorios.controller';
import { RelatoriosService } from './relatorios.service';

@Module({
  imports: [TypeOrmModule.forFeature([Movimentacao, Pastilha])],
  controllers: [RelatoriosController],
  providers: [RelatoriosService],
})
export class RelatoriosModule {}
