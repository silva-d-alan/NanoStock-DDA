import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { Movimentacao } from './movimentacao.entity';
import { Pastilha } from '../pastilhas/pastilha.entity';
import { PastilhasService } from '../pastilhas/pastilhas.service';
import { AlertasService } from '../alertas/alertas.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { DESTINOS, JUSTIFICATIVA_MIN } from './dto/movimentacao.dto';
import type { AjusteInventarioDTO, CriarMovimentacaoDTO, DestinoSaida, TipoMovimentacao } from '@dda/shared-types';

export interface FiltroMovimentacoes {
  pastilhaId?: string;
  tipo?: TipoMovimentacao;
}

@Injectable()
export class MovimentacoesService {
  constructor(
    @InjectRepository(Movimentacao) private readonly repo: Repository<Movimentacao>,
    private readonly pastilhasService: PastilhasService,
    private readonly alertasService: AlertasService,
    private readonly auditoria: AuditoriaService,
    private readonly dataSource: DataSource,
  ) {}

  /** RF09 – histórico completo (sem limite de registros), mais recente primeiro */
  findAll(filtro: FiltroMovimentacoes = {}) {
    const where: FindOptionsWhere<Movimentacao> = {};
    if (filtro.pastilhaId) where.pastilhaId = filtro.pastilhaId;
    if (filtro.tipo) where.tipo = filtro.tipo;
    return this.repo.find({ where, order: { data: 'DESC' } });
  }

  /** RF04 / RF05 / RN01 / RN02 / RN04 / RN09 / RN10 */
  async registrar(dto: CriarMovimentacaoDTO, usuarioId?: string) {
    this.exigirUsuario(usuarioId);
    this.validar(dto);

    return this.dataSource.transaction(async () => {
      const delta = dto.tipo === 'ENTRADA' ? dto.quantidade : -dto.quantidade;
      const pastilha = await this.pastilhasService.ajustarEstoque(dto.pastilhaId, delta);
      const saldoApos = pastilha.estoqueAtual;

      const salvo = await this.repo.save(
        this.repo.create({
          tipo: dto.tipo,
          quantidade: dto.quantidade,
          pastilhaId: dto.pastilhaId,
          usuarioId,
          notaFiscal: dto.tipo === 'ENTRADA' ? dto.notaFiscal?.trim() : undefined,
          destino: dto.tipo === 'SAIDA' ? dto.destino : undefined,
          observacao: dto.observacao,
          saldoAnterior: saldoApos - delta,
          saldoApos,
        }),
      );

      await this.auditoria.registrar({
        acao: dto.tipo,
        entidade: 'movimentacao',
        entidadeId: salvo.id,
        usuarioId,
        detalhes: {
          pastilhaId: dto.pastilhaId,
          quantidade: dto.quantidade,
          saldoAnterior: salvo.saldoAnterior,
          saldoApos,
        },
      });

      await this.verificarEstoqueMinimo(pastilha);
      return salvo;
    });
  }

  /** RF14 / RN05 – ajuste manual: informa-se a quantidade contada e o motivo */
  async ajustarInventario(dto: AjusteInventarioDTO, usuarioId?: string) {
    this.exigirUsuario(usuarioId);
    const justificativa = dto.justificativa?.trim() ?? '';
    if (justificativa.length < JUSTIFICATIVA_MIN) {
      throw new BadRequestException(
        `Justificativa obrigatória, com no mínimo ${JUSTIFICATIVA_MIN} caracteres (RN05)`,
      );
    }
    if (!Number.isInteger(dto.quantidadeContada) || dto.quantidadeContada < 0) {
      throw new BadRequestException('Quantidade contada deve ser um inteiro maior ou igual a zero');
    }

    return this.dataSource.transaction(async () => {
      const atual = await this.pastilhasService.findOne(dto.pastilhaId);
      const saldoAnterior = atual.estoqueAtual;
      const delta = dto.quantidadeContada - saldoAnterior;
      if (delta === 0) {
        throw new BadRequestException('A quantidade contada é igual ao saldo atual; nenhum ajuste necessário');
      }

      const pastilha = await this.pastilhasService.ajustarEstoque(dto.pastilhaId, delta);
      const salvo = await this.repo.save(
        this.repo.create({
          tipo: 'AJUSTE',
          quantidade: Math.abs(delta),
          pastilhaId: dto.pastilhaId,
          usuarioId,
          justificativa,
          saldoAnterior,
          saldoApos: pastilha.estoqueAtual,
        }),
      );

      await this.auditoria.registrar({
        acao: 'AJUSTE',
        entidade: 'movimentacao',
        entidadeId: salvo.id,
        usuarioId,
        detalhes: {
          pastilhaId: dto.pastilhaId,
          saldoAnterior,
          saldoApos: pastilha.estoqueAtual,
          justificativa,
        },
      });

      await this.verificarEstoqueMinimo(pastilha);
      return salvo;
    });
  }

  /** RF08 – alerta quando o saldo atinge (ou fica abaixo de) o mínimo */
  private async verificarEstoqueMinimo(pastilha: Pastilha) {
    if (pastilha.estoqueAtual <= pastilha.estoqueMinimo) {
      await this.alertasService.gerar(pastilha);
    }
  }

  private exigirUsuario(usuarioId?: string): asserts usuarioId is string {
    if (!usuarioId) {
      throw new UnauthorizedException('Movimentação exige usuário autenticado (RN02)');
    }
  }

  private validar(dto: CriarMovimentacaoDTO) {
    if (dto.tipo !== 'ENTRADA' && dto.tipo !== 'SAIDA') {
      throw new BadRequestException('Tipo de movimentação inválido');
    }
    if (!dto.pastilhaId) throw new BadRequestException('Item é obrigatório');
    if (!Number.isInteger(dto.quantidade) || dto.quantidade <= 0) {
      throw new BadRequestException('Quantidade deve ser um número inteiro maior que zero');
    }
    if (dto.tipo === 'ENTRADA' && !dto.notaFiscal?.trim()) {
      throw new BadRequestException('Nota fiscal é obrigatória na entrada (RF04)');
    }
    if (dto.tipo === 'SAIDA' && !DESTINOS.includes(dto.destino as DestinoSaida)) {
      throw new BadRequestException(
        'Saída deve informar o destino: PRODUCAO, MANUTENCAO ou TERCEIROS (RN09)',
      );
    }
  }
}
