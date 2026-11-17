import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Between, Repository } from 'typeorm';
import { RelatoriosService } from './relatorios.service';
import { Movimentacao } from '../movimentacoes/movimentacao.entity';
import { Pastilha } from '../pastilhas/pastilha.entity';

describe('RelatoriosService', () => {
  let service: RelatoriosService;
  let movRepo: DeepMocked<Repository<Movimentacao>>;
  let pastRepo: DeepMocked<Repository<Pastilha>>;
  const agora = new Date('2026-11-12T12:00:00.000Z');

  beforeEach(async () => {
    movRepo = createMock<Repository<Movimentacao>>();
    pastRepo = createMock<Repository<Pastilha>>();
    movRepo.find.mockResolvedValue([]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        RelatoriosService,
        { provide: getRepositoryToken(Movimentacao), useValue: movRepo },
        { provide: getRepositoryToken(Pastilha), useValue: pastRepo },
      ],
    }).compile();
    service = moduleRef.get(RelatoriosService);
  });

  it('CT52 - RN08: período de consumo inferior a 30 dias é ampliado para 30', async () => {
    const r = await service.consumo(7, agora);
    expect(r.periodoDias).toBe(30);
    expect(r.inicio.toISOString()).toBe('2026-10-13T12:00:00.000Z');
    expect(movRepo.find).toHaveBeenCalledWith({
      where: { tipo: 'SAIDA', data: Between(new Date('2026-10-13T12:00:00.000Z'), agora) },
    });
    // período maior que o mínimo é respeitado; valor inválido cai no mínimo
    expect((await service.consumo(90, agora)).periodoDias).toBe(90);
    expect((await service.consumo(Number('abc'), agora)).periodoDias).toBe(30);
  });

  it('CT53 - RF11: relatório de consumo agrupa as saídas por item e por destino', async () => {
    movRepo.find.mockResolvedValue([
      { pastilhaId: 'p2', quantidade: 1, destino: 'TERCEIROS', pastilha: { codigo: 'PST-002', descricao: 'B' } },
      { pastilhaId: 'p1', quantidade: 5, destino: 'PRODUCAO', pastilha: { codigo: 'PST-001', descricao: 'A' } },
      { pastilhaId: 'p1', quantidade: 3, destino: 'MANUTENCAO', pastilha: { codigo: 'PST-001', descricao: 'A' } },
    ] as Movimentacao[]);

    const r = await service.consumo(60, agora);

    expect(r.itens).toEqual([
      { pastilhaId: 'p1', codigo: 'PST-001', descricao: 'A', total: 8, porDestino: { PRODUCAO: 5, MANUTENCAO: 3 } },
      { pastilhaId: 'p2', codigo: 'PST-002', descricao: 'B', total: 1, porDestino: { TERCEIROS: 1 } },
    ]);
  });

  it('CT54 - RF11: relatório de reposição lista os itens no mínimo ou abaixo dele', async () => {
    pastRepo.find.mockResolvedValue([
      { id: 'p1', codigo: 'A', descricao: 'Item A', estoqueAtual: 4, estoqueMinimo: 10, fabricante: { nome: 'Sandvik' } },
      { id: 'p2', codigo: 'B', descricao: 'Item B', estoqueAtual: 30, estoqueMinimo: 10 },
      { id: 'p3', codigo: 'C', descricao: 'Item C', estoqueAtual: 10, estoqueMinimo: 10 },
    ] as Pastilha[]);

    const r = await service.reposicao();

    expect(r).toEqual([
      { id: 'p1', codigo: 'A', descricao: 'Item A', fabricante: 'Sandvik', estoqueAtual: 4, estoqueMinimo: 10, sugestaoCompra: 16 },
      { id: 'p3', codigo: 'C', descricao: 'Item C', fabricante: '', estoqueAtual: 10, estoqueMinimo: 10, sugestaoCompra: 10 },
    ]);
  });

  it('CT55 - RF11: relatório de movimentação por período valida as datas', async () => {
    const inicio = new Date('2026-10-01T00:00:00.000Z');
    const fim = new Date('2026-10-31T23:59:59.000Z');

    await service.movimentacao(inicio, fim);
    expect(movRepo.find).toHaveBeenCalledWith({ where: { data: Between(inicio, fim) }, order: { data: 'ASC' } });

    expect(() => service.movimentacao(fim, inicio)).toThrow(BadRequestException);
    expect(() => service.movimentacao(new Date('data-invalida'), fim)).toThrow('Período inválido');
  });

  it('CT56 - RF13: exporta CSV com cabeçalho e escape de caracteres especiais', () => {
    const csv = service.toCsv([
      { codigo: 'PST-001', descricao: 'Pastilha "CNMG"; 80°', total: 8 },
      { codigo: 'PST-002', descricao: 'Inserto TCMT', total: 0 },
    ]);
    expect(csv).toBe('codigo;descricao;total\nPST-001;"Pastilha ""CNMG""; 80°";8\nPST-002;Inserto TCMT;0');
    expect(service.toCsv([])).toBe('');
  });
});
