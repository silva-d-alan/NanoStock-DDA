import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { Pastilha } from '../pastilhas/pastilha.entity';
import { Movimentacao } from '../movimentacoes/movimentacao.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pastilha, Movimentacao])],
  controllers: [DashboardController],
})
export class DashboardModule {}