import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Movimentacao } from './movimentacao.entity';
import { PastilhasService } from '../pastilhas/pastilhas.service';
import { AlertasService } from '../alertas/alertas.service';
import type { CriarMovimentacaoDTO } from '@dda/shared-types';

@Injectable()
export class MovimentacoesService {
  constructor(
    @InjectRepository(Movimentacao) private readonly repo: Repository<Movimentacao>,
    private readonly pastilhasService: PastilhasService,
    private readonly alertasService: AlertasService,
    private readonly dataSource: DataSource,
  ) {}

  findAll() {
    return this.repo.find({ order: { data: 'DESC' }, take: 200 });
  }

  async registrar(dto: CriarMovimentacaoDTO, usuarioId: string) {
    return this.dataSource.transaction(async () => {
      const delta = dto.tipo === 'ENTRADA' ? dto.quantidade : -dto.quantidade;
      await this.pastilhasService.ajustarEstoque(dto.pastilhaId, delta);

      const mov = this.repo.create({ ...dto, usuarioId });
      const salvo = await this.repo.save(mov);

      const pastilha = await this.pastilhasService.findOne(dto.pastilhaId);
      if (pastilha.estoqueAtual <= pastilha.estoqueMinimo) {
        await this.alertasService.gerar(pastilha);
      }

      return salvo;
    });
  }
}