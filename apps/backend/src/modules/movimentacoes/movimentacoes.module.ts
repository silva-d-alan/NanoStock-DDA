import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movimentacao } from './movimentacao.entity';
import { MovimentacoesService } from './movimentacoes.service';
import { MovimentacoesController } from './movimentacoes.controller';
import { PastilhasModule } from '../pastilhas/pastilhas.module';
import { AlertasModule } from '../alertas/alertas.module';

@Module({
  imports: [TypeOrmModule.forFeature([Movimentacao]), PastilhasModule, AlertasModule],
  providers: [MovimentacoesService],
  controllers: [MovimentacoesController],
})
export class MovimentacoesModule {}