import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Movimentacao } from '../movimentacoes/movimentacao.entity';
import { Pastilha } from '../pastilhas/pastilha.entity';

/** RN08 – relatórios de consumo consideram no mínimo 30 dias */
export const PERIODO_MINIMO_DIAS = 30;
const DIA_MS = 86_400_000;

export interface ItemConsumo {
  pastilhaId: string;
  codigo: string;
  descricao: string;
  total: number;
  porDestino: Record<string, number>;
}

@Injectable()
export class RelatoriosService {
  constructor(
    @InjectRepository(Movimentacao) private readonly movRepo: Repository<Movimentacao>,
    @InjectRepository(Pastilha) private readonly pastRepo: Repository<Pastilha>,
  ) {}

  /** RN08 – períodos menores que 30 dias (ou inválidos) são ampliados para 30 */
  normalizarPeriodo(dias?: number) {
    const d = Number(dias);
    return Number.isFinite(d) && d >= PERIODO_MINIMO_DIAS ? Math.floor(d) : PERIODO_MINIMO_DIAS;
  }

  /** RF11 – consumo (saídas) por item e por setor de destino */
  async consumo(dias?: number, agora: Date = new Date()) {
    const periodoDias = this.normalizarPeriodo(dias);
    const inicio = new Date(agora.getTime() - periodoDias * DIA_MS);
    const saidas = await this.movRepo.find({
      where: { tipo: 'SAIDA', data: Between(inicio, agora) },
    });

    const mapa = new Map<string, ItemConsumo>();
    for (const m of saidas) {
      const item = mapa.get(m.pastilhaId) ?? {
        pastilhaId: m.pastilhaId,
        codigo: m.pastilha?.codigo ?? '',
        descricao: m.pastilha?.descricao ?? '',
        total: 0,
        porDestino: {},
      };
      item.total += m.quantidade;
      const destino = m.destino ?? 'NAO_INFORMADO';
      item.porDestino[destino] = (item.porDestino[destino] ?? 0) + m.quantidade;
      mapa.set(m.pastilhaId, item);
    }

    return {
      periodoDias,
      inicio,
      fim: agora,
      itens: [...mapa.values()].sort((a, b) => b.total - a.total),
    };
  }

  /** RF11 – movimentações de um período */
  movimentacao(inicio: Date, fim: Date) {
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || inicio > fim) {
      throw new BadRequestException('Período inválido');
    }
    return this.movRepo.find({ where: { data: Between(inicio, fim) }, order: { data: 'ASC' } });
  }

  /** RF11 – necessidade de reposição: itens no mínimo ou abaixo dele */
  async reposicao() {
    const itens = await this.pastRepo.find({ where: { ativo: true }, order: { descricao: 'ASC' } });
    return itens
      .filter((p) => p.estoqueAtual <= p.estoqueMinimo)
      .map((p) => ({
        id: p.id,
        codigo: p.codigo,
        descricao: p.descricao,
        fabricante: p.fabricante?.nome ?? '',
        estoqueAtual: p.estoqueAtual,
        estoqueMinimo: p.estoqueMinimo,
        // repõe até o dobro do mínimo; ao menos 1 unidade quando o mínimo é 0
        sugestaoCompra: Math.max(p.estoqueMinimo * 2 - p.estoqueAtual, 1),
      }));
  }

  /** RF13 – CSV com ";" (abre direto no Excel pt-BR) */
  toCsv(linhas: object[]): string {
    if (linhas.length === 0) return '';
    const colunas = Object.keys(linhas[0]);
    const esc = (v: unknown) => {
      const s = v instanceof Date ? v.toISOString() : String(v ?? '');
      return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [
      colunas.join(';'),
      ...linhas.map((l) => colunas.map((c) => esc((l as Record<string, unknown>)[c])).join(';')),
    ].join('\n');
  }
}
